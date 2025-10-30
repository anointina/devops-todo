#!/bin/bash

# DevOps Todo Application - Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="devops-todo"
AWS_REGION="us-west-2"
CLUSTER_NAME="${PROJECT_NAME}-cluster"
NAMESPACE="devops-todo"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed. Aborting."; exit 1; }
    command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed. Aborting."; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed. Aborting."; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || { log_error "AWS credentials not configured. Run 'aws configure' first."; exit 1; }
    
    log_success "All prerequisites met!"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan the deployment
    terraform plan -out=tfplan
    
    # Apply the plan
    terraform apply tfplan
    
    # Get outputs
    CLUSTER_NAME=$(terraform output -raw cluster_name)
    ECR_URI=$(terraform output -raw ecr_repository_url)
    
    log_success "Infrastructure deployed successfully!"
    
    cd ..
}

configure_kubectl() {
    log_info "Configuring kubectl for EKS cluster..."
    
    aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME
    
    # Verify connection
    kubectl cluster-info
    
    log_success "kubectl configured successfully!"
}

install_aws_load_balancer_controller() {
    log_info "Installing AWS Load Balancer Controller..."
    
    # Create service account
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: $(cd terraform && terraform output -raw aws_load_balancer_controller_role_arn)
EOF

    # Install using Helm
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
        --set clusterName=$CLUSTER_NAME \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller
    
    log_success "AWS Load Balancer Controller installed!"
}

build_and_push_image() {
    log_info "Building and pushing Docker image..."
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build image
    docker build -t $PROJECT_NAME:latest .
    
    # Tag for ECR
    ECR_URI=$(aws ecr describe-repositories --repository-names $PROJECT_NAME --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text)
    docker tag $PROJECT_NAME:latest $ECR_URI:latest
    docker tag $PROJECT_NAME:latest $ECR_URI:$(git rev-parse --short HEAD)
    
    # Push to ECR
    docker push $ECR_URI:latest
    docker push $ECR_URI:$(git rev-parse --short HEAD)
    
    log_success "Docker image built and pushed to ECR!"
}

deploy_application() {
    log_info "Deploying application to Kubernetes..."
    
    # Update image in deployment
    ECR_URI=$(aws ecr describe-repositories --repository-names $PROJECT_NAME --region $AWS_REGION --query 'repositories[0].repositoryUri' --output text)
    sed -i.bak "s|YOUR_DOCKERHUB_USERNAME/devops-todo:latest|$ECR_URI:latest|g" k8s/deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/ingress.yaml
    kubectl apply -f k8s/hpa.yaml
    
    # Wait for deployment
    kubectl rollout status deployment/devops-todo -n $NAMESPACE --timeout=300s
    
    log_success "Application deployed successfully!"
}

get_application_url() {
    log_info "Getting application URL..."
    
    # Wait for ALB to be ready
    log_info "Waiting for Application Load Balancer to be ready..."
    sleep 60
    
    ALB_URL=$(kubectl get ingress devops-todo-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
    
    if [ -n "$ALB_URL" ]; then
        log_success "Application is available at: http://$ALB_URL"
        log_info "Health check: http://$ALB_URL/health"
        log_info "Statistics: http://$ALB_URL/stats"
    else
        log_warning "ALB URL not ready yet. Check later with: kubectl get ingress -n $NAMESPACE"
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Restore original deployment file
    if [ -f k8s/deployment.yaml.bak ]; then
        mv k8s/deployment.yaml.bak k8s/deployment.yaml
    fi
    
    # Remove terraform plan
    if [ -f terraform/tfplan ]; then
        rm terraform/tfplan
    fi
}

main() {
    log_info "Starting DevOps Todo deployment to AWS..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    check_prerequisites
    deploy_infrastructure
    configure_kubectl
    install_aws_load_balancer_controller
    build_and_push_image
    deploy_application
    get_application_url
    
    log_success "Deployment completed successfully! 🚀"
    log_info "Your DevOps Todo application is now running on AWS EKS!"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi