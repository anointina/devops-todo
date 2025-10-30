# 🔐 GitHub Secrets Setup - REQUIRED

## ⚠️ IMPORTANT: Add These Secrets Before Running CI/CD

Your GitHub Actions workflow requires AWS credentials to function properly. Follow these steps:

### 1. Navigate to Repository Settings
1. Go to: `https://github.com/anointina/devops-todo/settings/secrets/actions`
2. Click **"New repository secret"**

### 2. Add Required Secrets

#### Secret 1: AWS Access Key ID
- **Name**: `AWS_ACCESS_KEY_ID`
- **Value**: `[Your AWS Access Key ID from previous setup]`

#### Secret 2: AWS Secret Access Key
- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Value**: `[Your AWS Secret Access Key from previous setup]`

> **Note**: Use the AWS credentials you configured earlier when setting up the local environment.

### 3. Verify Secrets Added
After adding both secrets, you should see:
- ✅ AWS_ACCESS_KEY_ID (hidden)
- ✅ AWS_SECRET_ACCESS_KEY (hidden)

## 🔄 What Happens After Adding Secrets

Once secrets are added, the CI/CD pipeline will:

1. **✅ Run Tests** - Test your Node.js application
2. **✅ Security Scan** - Scan code for vulnerabilities
3. **✅ Build and Push** - Build Docker image and push to ECR
4. **✅ Deploy to AWS** - Deploy to EKS (if infrastructure exists)
5. **✅ Cleanup** - Remove old Docker images

## 🏗️ Infrastructure Status

The pipeline automatically checks if AWS infrastructure exists:
- **EKS Cluster**: `devops-todo-cluster`
- **ECR Repository**: `devops-todo`
- **Node Groups**: Must be ACTIVE

If infrastructure doesn't exist, deployment will be skipped with helpful messages.

## 🚀 Quick Test

After adding secrets, make any small change (like updating README) and push to trigger the workflow:

```bash
git add .
git commit -m "test: trigger CI/CD pipeline"
git push origin main
```

## 📊 Expected Results

You should see all these steps succeed in GitHub Actions:
- ✅ Run Tests
- ✅ Security Scan  
- ✅ Build and Push Docker Image
- ✅ Deploy to AWS EKS (if infrastructure ready)
- ✅ Cleanup old images

## 🔧 Troubleshooting

If any step fails:
1. Check the GitHub Actions logs
2. Verify secrets are added correctly
3. Ensure AWS credentials have proper permissions
4. Check if Terraform infrastructure is deployed

## 🎯 Next Steps

1. **Add the secrets above** ⬆️
2. **Push a test commit** to trigger the workflow
3. **Monitor GitHub Actions** tab for results
4. **Deploy Terraform infrastructure** if needed for full deployment