# DevOps Todo - AWS Setup Script for Windows
# This script installs required tools and configures AWS credentials

Write-Host "🚀 Setting up AWS deployment environment..." -ForegroundColor Blue

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to install via winget if available
function Install-WithWinget($package, $name) {
    if (Test-Command "winget") {
        Write-Host "Installing $name via winget..." -ForegroundColor Yellow
        winget install $package --accept-package-agreements --accept-source-agreements
        return $true
    }
    return $false
}

# Function to install via Chocolatey if available
function Install-WithChocolatey($package, $name) {
    if (Test-Command "choco") {
        Write-Host "Installing $name via Chocolatey..." -ForegroundColor Yellow
        choco install $package -y
        return $true
    }
    return $false
}

# Check and install AWS CLI
if (-not (Test-Command "aws")) {
    Write-Host "❌ AWS CLI not found. Installing..." -ForegroundColor Red
    
    if (-not (Install-WithWinget "Amazon.AWSCLI" "AWS CLI")) {
        if (-not (Install-WithChocolatey "awscli" "AWS CLI")) {
            Write-Host "Please install AWS CLI manually from: https://aws.amazon.com/cli/" -ForegroundColor Red
            Write-Host "Or install winget/chocolatey first" -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "✅ AWS CLI already installed" -ForegroundColor Green
}

# Check and install Terraform
if (-not (Test-Command "terraform")) {
    Write-Host "❌ Terraform not found. Installing..." -ForegroundColor Red
    
    if (-not (Install-WithWinget "Hashicorp.Terraform" "Terraform")) {
        if (-not (Install-WithChocolatey "terraform" "Terraform")) {
            Write-Host "Please install Terraform manually from: https://www.terraform.io/downloads" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "✅ Terraform already installed" -ForegroundColor Green
}

# Check and install kubectl
if (-not (Test-Command "kubectl")) {
    Write-Host "❌ kubectl not found. Installing..." -ForegroundColor Red
    
    if (-not (Install-WithWinget "Kubernetes.kubectl" "kubectl")) {
        if (-not (Install-WithChocolatey "kubernetes-cli" "kubectl")) {
            Write-Host "Please install kubectl manually from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "✅ kubectl already installed" -ForegroundColor Green
}

# Check and install Helm
if (-not (Test-Command "helm")) {
    Write-Host "❌ Helm not found. Installing..." -ForegroundColor Red
    
    if (-not (Install-WithWinget "Helm.Helm" "Helm")) {
        if (-not (Install-WithChocolatey "kubernetes-helm" "Helm")) {
            Write-Host "Please install Helm manually from: https://helm.sh/docs/intro/install/" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "✅ Helm already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 Configuring AWS credentials..." -ForegroundColor Blue

# Configure AWS credentials
$accessKey = "AKIAZBWGBKVY6YAVVSEX"
$secretKey = "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"
$region = "us-west-2"

# Create AWS credentials directory if it doesn't exist
$awsDir = "$env:USERPROFILE\.aws"
if (-not (Test-Path $awsDir)) {
    New-Item -ItemType Directory -Path $awsDir -Force
}

# Write credentials file
$credentialsContent = @"
[default]
aws_access_key_id = $accessKey
aws_secret_access_key = $secretKey
"@

$credentialsPath = Join-Path $awsDir "credentials"
$configPath = Join-Path $awsDir "config"

$credentialsContent | Out-File -FilePath $credentialsPath -Encoding UTF8

# Write config file
$configContent = @"
[default]
region = $region
output = json
"@

$configContent | Out-File -FilePath $configPath -Encoding UTF8

Write-Host "✅ AWS credentials configured" -ForegroundColor Green

# Test AWS connection
Write-Host ""
Write-Host "🧪 Testing AWS connection..." -ForegroundColor Blue

try {
    $identity = aws sts get-caller-identity 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AWS connection successful!" -ForegroundColor Green
        $identityObj = $identity | ConvertFrom-Json
        Write-Host "Account ID: $($identityObj.Account)" -ForegroundColor Cyan
        Write-Host "User ARN: $($identityObj.Arn)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ AWS connection failed. Please check your credentials." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error testing AWS connection: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\scripts\deploy-aws.ps1" -ForegroundColor White
Write-Host "2. Or follow the manual deployment guide in AWS_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""