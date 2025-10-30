#!/bin/bash

# DevOps Todo Application - Destroy Script
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

confirm_destruction() {
    log_warning "This will destroy ALL resources for the DevOps Todo application!"
    log_warning "This action cannot be undone."
    echo
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "Destruction cancelled."
        exit 0
    fi
}

cleanup_kubernetes_resources() {
    log_info "Cleaning up Kubernetes resources..."
    
    # Check if cluster exists and kubectl is configured
    if kubectl cluster-info >/dev/null 2>&1; then
        # Delete application resources
        kubectl delete -f k8s/ --ignore-not-found=true
        
        # Delete namespace (this will delete everything in it)
        kubectl delete namespace $NAMESPACE --ignore-not-found=true
        
        # Uninstall AWS Load Balancer Controller
        helm uninstall aws-load-balancer-controller -n kube-system --ignore-not-found || true
        
        log_success "Kubernetes resources cleaned up!"
    else
        log_warning "Cannot connect to Kubernetes cluster. Skipping Kubernetes cleanup."
    fi
}

cleanup_ecr_images() {
    log_info "Cleaning up ECR images..."
    
    # Delete all images in the repository
    aws ecr list-images --repository-name $PROJECT_NAME --region $AWS_REGION --query 'imageIds[*]' --output json | \
    jq '.[] | select(.imageTag != null) | {imageTag: .imageTag}' | \
    jq -s '.' > /tmp/images-to-delete.json
    
    if [ -s /tmp/images-to-delete.json ] && [ "$(cat /tmp/images-to-delete.json)" != "[]" ]; then
        aws ecr batch-delete-image --repository-name $PROJECT_NAME --region $AWS_REGION --image-ids file:///tmp/images-to-delete.json
        log_success "ECR images deleted!"
    else
        log_info "No ECR images to delete."
    fi
    
    rm -f /tmp/images-to-delete.json
}

destroy_infrastructure() {
    log_info "Destroying infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform (in case it's not initialized)
    terraform init
    
    # Destroy infrastructure
    terraform destroy -auto-approve
    
    log_success "Infrastructure destroyed successfully!"
    
    cd ..
}

cleanup_local_files() {
    log_info "Cleaning up local files..."
    
    # Remove kubeconfig context
    kubectl config delete-context $CLUSTER_NAME >/dev/null 2>&1 || true
    kubectl config delete-cluster $CLUSTER_NAME >/dev/null 2>&1 || true
    kubectl config delete-user $CLUSTER_NAME >/dev/null 2>&1 || true
    
    # Remove terraform state backup files
    find terraform -name "*.tfstate.backup" -delete 2>/dev/null || true
    find terraform -name ".terraform.lock.hcl" -delete 2>/dev/null || true
    rm -rf terraform/.terraform 2>/dev/null || true
    
    log_success "Local files cleaned up!"
}

main() {
    log_info "Starting DevOps Todo infrastructure destruction..."
    
    confirm_destruction
    
    cleanup_kubernetes_resources
    cleanup_ecr_images
    destroy_infrastructure
    cleanup_local_files
    
    log_success "Destruction completed successfully! 🗑️"
    log_info "All AWS resources for DevOps Todo have been removed."
    log_warning "Please verify in AWS Console that all resources are deleted to avoid unexpected charges."
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi