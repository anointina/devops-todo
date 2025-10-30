# DevOps Todo Application - AWS Deployment Script for Windows
param(
    [string]$Region = "us-west-2",
    [string]$ProjectName = "devops-todo",
    [switch]$SkipInfrastructure,
    [switch]$SkipApplication,
    [switch]$Destroy
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor $Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor $Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor $Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor $Red
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    $tools = @("aws", "terraform", "kubectl", "docker")
    $missing = @()
    
    foreach ($tool in $tools) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            $missing += $tool
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "Missing required tools: $($missing -join ', ')"
        Write-Info "Run .\scripts\setup-aws-windows.ps1 first"
        exit 1
    }
    
    # Test AWS credentials
    try {
        $null = aws sts get-caller-identity 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "AWS credentials not configured or invalid"
            exit 1
        }
    } catch {
        Write-Error "Error testing AWS credentials: $_"
        exit 1
    }
    
    Write-Success "All prerequisites met!"
}

function Deploy-Infrastructure {
    Write-Info "Deploying infrastructure with Terraform..."
    
    Push-Location terraform
    
    try {
        # Initialize Terraform
        Write-Info "Initializing Terraform..."
        terraform init
        if ($LASTEXITCODE -ne 0) { throw "Terraform init failed" }
        
        # Plan the deployment
        Write-Info "Planning Terraform deployment..."
        terraform plan -out=tfplan -var="aws_region=$Region" -var="project_name=$ProjectName"
        if ($LASTEXITCODE -ne 0) { throw "Terraform plan failed" }
        
        # Apply the plan
        Write-Info "Applying Terraform plan..."
        terraform apply tfplan
        if ($LASTEXITCODE -ne 0) { throw "Terraform apply failed" }
        
        Write-Success "Infrastructure deployed successfully!"
        
        # Get outputs
        $clusterName = terraform output -raw cluster_name
        $ecrUri = terraform output -raw ecr_repository_url
        
        Write-Info "Cluster Name: $clusterName"
        Write-Info "ECR URI: $ecrUri"
        
        return @{
            ClusterName = $clusterName
            EcrUri = $ecrUri
        }
        
    } catch {
        Write-Error "Infrastructure deployment failed: $_"
        exit 1
    } finally {
        Pop-Location
    }
}

function Configure-Kubectl($clusterName) {
    Write-Info "Configuring kubectl for EKS cluster..."
    
    try {
        aws eks update-kubeconfig --region $Region --name $clusterName
        if ($LASTEXITCODE -ne 0) { throw "Failed to update kubeconfig" }
        
        # Verify connection
        kubectl cluster-info
        if ($LASTEXITCODE -ne 0) { throw "Failed to connect to cluster" }
        
        Write-Success "kubectl configured successfully!"
    } catch {
        Write-Error "kubectl configuration failed: $_"
        exit 1
    }
}

function Install-LoadBalancerController($clusterName) {
    Write-Info "Installing AWS Load Balancer Controller..."
    
    try {
        # Get the role ARN from Terraform output
        Push-Location terraform
        $roleArn = terraform output -raw aws_load_balancer_controller_role_arn
        Pop-Location
        
        # Create service account
        $serviceAccountYaml = @"
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: $roleArn
"@
        
        $serviceAccountYaml | kubectl apply -f -
        if ($LASTEXITCODE -ne 0) { throw "Failed to create service account" }
        
        # Add Helm repository
        helm repo add eks https://aws.github.io/eks-charts
        helm repo update
        
        # Install AWS Load Balancer Controller
        helm install aws-load-balancer-controller eks/aws-load-balancer-controller `
            -n kube-system `
            --set clusterName=$clusterName `
            --set serviceAccount.create=false `
            --set serviceAccount.name=aws-load-balancer-controller
        
        if ($LASTEXITCODE -ne 0) { throw "Failed to install Load Balancer Controller" }
        
        Write-Success "AWS Load Balancer Controller installed!"
    } catch {
        Write-Error "Load Balancer Controller installation failed: $_"
        exit 1
    }
}

function Build-PushImage($ecrUri) {
    Write-Info "Building and pushing Docker image..."
    
    try {
        # Get ECR login token
        $loginCmd = aws ecr get-login-password --region $Region
        $loginCmd | docker login --username AWS --password-stdin $ecrUri.Split('/')[0]
        if ($LASTEXITCODE -ne 0) { throw "ECR login failed" }
        
        # Build image
        Write-Info "Building Docker image..."
        docker build -t ${ProjectName}:latest .
        if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
        
        # Tag for ECR
        $imageTag = "latest"
        $gitHash = git rev-parse --short HEAD 2>$null
        if ($gitHash) { $imageTag = $gitHash }
        
        docker tag ${ProjectName}:latest ${ecrUri}:latest
        docker tag ${ProjectName}:latest ${ecrUri}:$imageTag
        
        # Push to ECR
        Write-Info "Pushing to ECR..."
        docker push ${ecrUri}:latest
        docker push ${ecrUri}:$imageTag
        if ($LASTEXITCODE -ne 0) { throw "Docker push failed" }
        
        Write-Success "Docker image built and pushed to ECR!"
        return "${ecrUri}:latest"
    } catch {
        Write-Error "Image build/push failed: $_"
        exit 1
    }
}

function Deploy-Application($imageUri) {
    Write-Info "Deploying application to Kubernetes..."
    
    try {
        # Update deployment with ECR image URI
        $deploymentContent = Get-Content "k8s\deployment.yaml" -Raw
        $deploymentContent = $deploymentContent -replace "YOUR_DOCKERHUB_USERNAME/devops-todo:latest", $imageUri
        $deploymentContent | Out-File "k8s\deployment-updated.yaml" -Encoding UTF8
        
        # Apply Kubernetes manifests
        kubectl apply -f k8s\namespace.yaml
        kubectl apply -f k8s\configmap.yaml
        kubectl apply -f k8s\deployment-updated.yaml
        kubectl apply -f k8s\service.yaml
        kubectl apply -f k8s\ingress.yaml
        kubectl apply -f k8s\hpa.yaml
        
        if ($LASTEXITCODE -ne 0) { throw "Failed to apply Kubernetes manifests" }
        
        # Wait for deployment
        Write-Info "Waiting for deployment to be ready..."
        kubectl rollout status deployment/devops-todo -n devops-todo --timeout=300s
        if ($LASTEXITCODE -ne 0) { throw "Deployment rollout failed" }
        
        Write-Success "Application deployed successfully!"
        
        # Clean up temporary file
        Remove-Item "k8s\deployment-updated.yaml" -ErrorAction SilentlyContinue
        
    } catch {
        Write-Error "Application deployment failed: $_"
        exit 1
    }
}

function Get-ApplicationUrl {
    Write-Info "Getting application URL..."
    
    # Wait for ALB to be ready
    Write-Info "Waiting for Application Load Balancer to be ready..."
    Start-Sleep -Seconds 60
    
    try {
        $albUrl = kubectl get ingress devops-todo-ingress -n devops-todo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>$null
        
        if ($albUrl) {
            Write-Success "Application is available at: http://$albUrl"
            Write-Info "Health check: http://$albUrl/health"
            Write-Info "Statistics: http://$albUrl/stats"
            
            # Test health endpoint
            Start-Sleep -Seconds 30
            try {
                $response = Invoke-WebRequest -Uri "http://$albUrl/health" -TimeoutSec 10
                if ($response.StatusCode -eq 200) {
                    Write-Success "Health check passed!"
                }
            } catch {
                Write-Warning "Health check failed, but deployment completed. ALB may still be initializing."
            }
        } else {
            Write-Warning "ALB URL not ready yet. Check later with: kubectl get ingress -n devops-todo"
        }
    } catch {
        Write-Warning "Could not retrieve application URL: $_"
    }
}

function Destroy-Infrastructure {
    Write-Warning "This will destroy ALL resources for the DevOps Todo application!"
    $confirmation = Read-Host "Are you sure you want to continue? (type 'yes' to confirm)"
    
    if ($confirmation -ne "yes") {
        Write-Info "Destruction cancelled."
        return
    }
    
    Write-Info "Destroying infrastructure..."
    
    # Clean up Kubernetes resources
    try {
        kubectl delete -f k8s\ --ignore-not-found=true
        kubectl delete namespace devops-todo --ignore-not-found=true
        helm uninstall aws-load-balancer-controller -n kube-system --ignore-not-found
    } catch {
        Write-Warning "Some Kubernetes resources may not have been cleaned up: $_"
    }
    
    # Destroy Terraform infrastructure
    Push-Location terraform
    try {
        terraform destroy -auto-approve -var="aws_region=$Region" -var="project_name=$ProjectName"
        Write-Success "Infrastructure destroyed successfully!"
    } catch {
        Write-Error "Infrastructure destruction failed: $_"
    } finally {
        Pop-Location
    }
}

# Main execution
function Main {
    Write-Info "Starting DevOps Todo deployment to AWS..."
    Write-Info "Region: $Region"
    Write-Info "Project: $ProjectName"
    
    if ($Destroy) {
        Destroy-Infrastructure
        return
    }
    
    Test-Prerequisites
    
    $infraOutputs = $null
    if (-not $SkipInfrastructure) {
        $infraOutputs = Deploy-Infrastructure
        Configure-Kubectl $infraOutputs.ClusterName
        Install-LoadBalancerController $infraOutputs.ClusterName
    } else {
        # Get existing infrastructure outputs
        Push-Location terraform
        $infraOutputs = @{
            ClusterName = terraform output -raw cluster_name
            EcrUri = terraform output -raw ecr_repository_url
        }
        Pop-Location
        Configure-Kubectl $infraOutputs.ClusterName
    }
    
    if (-not $SkipApplication) {
        $imageUri = Build-PushImage $infraOutputs.EcrUri
        Deploy-Application $imageUri
        Get-ApplicationUrl
    }
    
    Write-Success "Deployment completed successfully! 🚀"
    Write-Info "Your DevOps Todo application is now running on AWS EKS!"
}

# Run main function
Main