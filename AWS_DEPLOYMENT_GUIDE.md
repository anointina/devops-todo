# DevOps Todo Application - AWS Deployment Guide

## 🚀 Complete AWS Deployment with EKS, Terraform, and CI/CD

This guide will help you deploy the DevOps Todo application to AWS using modern DevOps practices including Infrastructure as Code (Terraform), Container Orchestration (EKS), and CI/CD pipelines (GitHub Actions).

## 📋 Prerequisites

### Required Tools
- **AWS CLI** (v2.x) - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **Terraform** (v1.0+) - [Installation Guide](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- **kubectl** (v1.28+) - [Installation Guide](https://kubernetes.io/docs/tasks/tools/)
- **Docker** (v20.x+) - [Installation Guide](https://docs.docker.com/get-docker/)
- **Helm** (v3.x) - [Installation Guide](https://helm.sh/docs/intro/install/)
- **Git** - [Installation Guide](https://git-scm.com/downloads)

### AWS Account Setup
1. **AWS Account** with appropriate permissions
2. **AWS CLI configured** with credentials
3. **IAM User** with the following policies:
   - `AmazonEKSClusterPolicy`
   - `AmazonEKSWorkerNodePolicy`
   - `AmazonEKS_CNI_Policy`
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonVPCFullAccess`
   - `IAMFullAccess`
   - `AmazonEC2FullAccess`

### GitHub Repository Setup
1. Fork or clone this repository
2. Set up the following GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────┘

    Internet                     AWS VPC (10.0.0.0/16)
        │                    ┌─────────────────────────────────┐
        │                    │                                 │
        ▼                    │  ┌─────────────────────────────┐ │
┌─────────────────┐          │  │     Public Subnets          │ │
│   Users/CDN     │          │  │   (10.0.0.0/24, 10.0.1.0/24)│ │
└─────────────────┘          │  │                             │ │
        │                    │  │  ┌─────────────────────────┐ │ │
        │                    │  │  │  Application Load       │ │ │
        ▼                    │  │  │  Balancer (ALB)         │ │ │
┌─────────────────┐          │  │  └─────────────────────────┘ │ │
│  Route 53 DNS   │          │  │                             │ │
│   (Optional)    │          │  │  ┌─────────────────────────┐ │ │
└─────────────────┘          │  │  │  NAT Gateway            │ │ │
        │                    │  │  └─────────────────────────┘ │ │
        │                    │  └─────────────────────────────┘ │
        ▼                    │                                 │
┌─────────────────┐          │  ┌─────────────────────────────┐ │
│   CloudFront    │          │  │     Private Subnets         │ │
│   (Optional)    │          │  │  (10.0.10.0/24, 10.0.11.0/24)│ │
└─────────────────┘          │  │                             │ │
        │                    │  │  ┌─────────────────────────┐ │ │
        │                    │  │  │     EKS Cluster         │ │ │
        ▼                    │  │  │                         │ │ │
┌─────────────────┐          │  │  │  ┌─────────────────────┐│ │ │
│      ALB        │◀─────────┼──┼──┼──│  Worker Nodes       ││ │ │
│   (Internet     │          │  │  │  │  (t3.medium)        ││ │ │
│    Facing)      │          │  │  │  │                     ││ │ │
└─────────────────┘          │  │  │  │  ┌─────────────────┐││ │ │
        │                    │  │  │  │  │  DevOps Todo    │││ │ │
        │                    │  │  │  │  │  Pods (3x)      │││ │ │
        ▼                    │  │  │  │  └─────────────────┘││ │ │
┌─────────────────┐          │  │  │  └─────────────────────┘│ │ │
│   EKS Pods      │          │  │  └─────────────────────────┘ │ │
│  (DevOps Todo)  │          │  └─────────────────────────────┘ │
└─────────────────┘          └─────────────────────────────────┘

External Services:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Amazon ECR    │    │   GitHub        │    │   Docker Hub    │
│  (Container     │    │   (CI/CD)       │    │   (Backup)      │
│   Registry)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Deployment

### Option 1: Automated Deployment Script

```bash
# Clone the repository
git clone <your-repo-url>
cd devops-todo

# Make deployment script executable
chmod +x scripts/deploy.sh

# Run the deployment
./scripts/deploy.sh
```

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region (us-west-2), and output format (json)

# Verify configuration
aws sts get-caller-identity
```

#### Step 2: Deploy Infrastructure with Terraform
```bash
cd terraform

# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy infrastructure
terraform apply
```

#### Step 3: Configure kubectl for EKS
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name devops-todo-cluster

# Verify connection
kubectl cluster-info
kubectl get nodes
```

#### Step 4: Install AWS Load Balancer Controller
```bash
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

# Add Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install AWS Load Balancer Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=devops-todo-cluster \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller
```

#### Step 5: Build and Push Docker Image
```bash
# Get ECR login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-west-2.amazonaws.com

# Build and tag image
docker build -t devops-todo:latest .
ECR_URI=$(aws ecr describe-repositories --repository-names devops-todo --region us-west-2 --query 'repositories[0].repositoryUri' --output text)
docker tag devops-todo:latest $ECR_URI:latest

# Push to ECR
docker push $ECR_URI:latest
```

#### Step 6: Deploy Application to Kubernetes
```bash
# Update deployment with ECR image URI
sed -i "s|YOUR_DOCKERHUB_USERNAME/devops-todo:latest|$ECR_URI:latest|g" k8s/deployment.yaml

# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Wait for deployment to be ready
kubectl rollout status deployment/devops-todo -n devops-todo --timeout=300s
```

#### Step 7: Get Application URL
```bash
# Wait for ALB to be provisioned (may take 2-3 minutes)
kubectl get ingress -n devops-todo -w

# Get the application URL
ALB_URL=$(kubectl get ingress devops-todo-ingress -n devops-todo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Application URL: http://$ALB_URL"
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Tests** the application
2. **Scans** for security vulnerabilities
3. **Builds** Docker image and pushes to ECR
4. **Deploys** to EKS cluster
5. **Verifies** deployment health
6. **Cleans up** old images

### Required GitHub Secrets

Set these in your GitHub repository settings:

```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

### Triggering Deployments

- **Automatic**: Push to `main` branch triggers full deployment
- **Manual**: Use GitHub Actions UI to trigger deployment
- **Pull Requests**: Automatically run tests and security scans

## 📊 Monitoring and Management

### Application Health Checks
```bash
# Check application health
curl http://$ALB_URL/health

# Check application statistics
curl http://$ALB_URL/stats

# View application logs
kubectl logs -f deployment/devops-todo -n devops-todo
```

### Kubernetes Management
```bash
# View pods
kubectl get pods -n devops-todo

# View services
kubectl get services -n devops-todo

# View ingress
kubectl get ingress -n devops-todo

# Scale application
kubectl scale deployment devops-todo --replicas=5 -n devops-todo

# View HPA status
kubectl get hpa -n devops-todo
```

### Infrastructure Management
```bash
# View Terraform state
cd terraform
terraform show

# Update infrastructure
terraform plan
terraform apply

# View outputs
terraform output
```

## 🔒 Security Features

### Container Security
- **Vulnerability Scanning**: Trivy scans in CI/CD
- **Non-root User**: Containers run as non-root
- **Read-only Root Filesystem**: Enhanced security
- **Resource Limits**: CPU and memory constraints

### Network Security
- **Private Subnets**: Worker nodes in private subnets
- **Security Groups**: Restrictive network policies
- **ALB**: Internet-facing load balancer only
- **VPC**: Isolated network environment

### Access Control
- **RBAC**: Kubernetes role-based access control
- **IAM Roles**: Service accounts with minimal permissions
- **ECR**: Private container registry
- **Secrets Management**: Kubernetes secrets for sensitive data

## 💰 Cost Optimization

### Current Resources and Estimated Costs (us-west-2)
- **EKS Cluster**: ~$73/month
- **EC2 Instances** (2x t3.medium): ~$60/month
- **NAT Gateway**: ~$45/month
- **ALB**: ~$22/month
- **ECR Storage**: ~$1/month (for small images)
- **Data Transfer**: Variable based on usage

**Total Estimated Cost**: ~$200/month

### Cost Optimization Tips
1. **Use Spot Instances** for worker nodes (50-70% savings)
2. **Right-size instances** based on actual usage
3. **Enable cluster autoscaler** to scale down during low usage
4. **Use Fargate** for serverless container execution
5. **Implement lifecycle policies** for ECR images

## 🧹 Cleanup and Destruction

### Automated Cleanup
```bash
# Run the destruction script
chmod +x scripts/destroy.sh
./scripts/destroy.sh
```

### Manual Cleanup
```bash
# Delete Kubernetes resources
kubectl delete -f k8s/ --ignore-not-found=true
kubectl delete namespace devops-todo --ignore-not-found=true

# Uninstall Helm charts
helm uninstall aws-load-balancer-controller -n kube-system

# Destroy infrastructure
cd terraform
terraform destroy
```

## 🔧 Troubleshooting

### Common Issues

#### 1. EKS Cluster Creation Fails
```bash
# Check AWS permissions
aws iam get-user
aws iam list-attached-user-policies --user-name YOUR_USERNAME

# Check service limits
aws service-quotas get-service-quota --service-code eks --quota-code L-1194D53C
```

#### 2. Pods Not Starting
```bash
# Check pod status
kubectl describe pod -n devops-todo

# Check events
kubectl get events -n devops-todo --sort-by='.lastTimestamp'

# Check logs
kubectl logs -f deployment/devops-todo -n devops-todo
```

#### 3. ALB Not Accessible
```bash
# Check ingress status
kubectl describe ingress devops-todo-ingress -n devops-todo

# Check ALB controller logs
kubectl logs -f deployment/aws-load-balancer-controller -n kube-system

# Check security groups
aws ec2 describe-security-groups --filters "Name=group-name,Values=*devops-todo*"
```

#### 4. Image Pull Errors
```bash
# Check ECR permissions
aws ecr describe-repositories --repository-names devops-todo

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name devops-todo-cluster

# Check node IAM roles
kubectl describe node
```

### Useful Commands

```bash
# Get cluster info
kubectl cluster-info dump

# Check resource usage
kubectl top nodes
kubectl top pods -n devops-todo

# Port forward for local testing
kubectl port-forward service/devops-todo-service 3000:80 -n devops-todo

# Execute into pod
kubectl exec -it deployment/devops-todo -n devops-todo -- /bin/sh
```

## 📚 Additional Resources

### Documentation
- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)

### Best Practices
- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [Container Security Best Practices](https://kubernetes.io/docs/concepts/security/)

### Monitoring and Observability
- [Prometheus on EKS](https://docs.aws.amazon.com/eks/latest/userguide/prometheus.html)
- [AWS CloudWatch Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

## 🎯 Next Steps

1. **Set up monitoring** with Prometheus and Grafana
2. **Implement centralized logging** with ELK stack
3. **Add database persistence** with RDS or DynamoDB
4. **Set up custom domain** with Route 53 and SSL certificates
5. **Implement blue-green deployments** for zero-downtime updates
6. **Add backup and disaster recovery** procedures
7. **Set up multi-environment** (dev, staging, prod) pipelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🚀 Your DevOps Todo application is now running on AWS with enterprise-grade infrastructure!**