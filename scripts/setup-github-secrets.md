# GitHub Secrets Setup Guide

## Required GitHub Secrets

To enable the full CI/CD pipeline with AWS deployment, you need to add the following secrets to your GitHub repository:

### 1. Navigate to GitHub Secrets
1. Go to your GitHub repository: `https://github.com/anointina/devops-todo`
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2. Add AWS Credentials

#### Secret 1: AWS_ACCESS_KEY_ID
- **Name**: `AWS_ACCESS_KEY_ID`
- **Value**: `AKIAZBWGBKVY6YAVVSEX`

#### Secret 2: AWS_SECRET_ACCESS_KEY
- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Value**: `XN0wwIWWyCVrkwbGeajRopQMud8uA4x7SIBHFedB`

### 3. Verify Secrets
After adding both secrets, you should see:
- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY

## Alternative: Use GitHub CLI

If you have GitHub CLI installed, you can add secrets using commands:

```bash
# Install GitHub CLI first if not installed
# Then authenticate: gh auth login

gh secret set AWS_ACCESS_KEY_ID --body "AKIAZBWGBKVY6YAVVSEX"
gh secret set AWS_SECRET_ACCESS_KEY --body "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"
```

## What These Secrets Enable

Once added, the GitHub Actions workflow will be able to:
- ✅ Push Docker images to Amazon ECR
- ✅ Deploy applications to Amazon EKS
- ✅ Manage AWS resources automatically
- ✅ Run the complete CI/CD pipeline

## Security Notes

- ✅ These secrets are encrypted and only accessible to GitHub Actions
- ✅ They are not visible in logs or to other users
- ✅ They follow AWS IAM best practices with minimal required permissions

## Next Steps

1. **Add the secrets** using the steps above
2. **Push a commit** to trigger the workflow
3. **Monitor the Actions tab** to see the pipeline run
4. **Deploy infrastructure** using Terraform if not already done

## Workflow Status

- **Simple CI** (`.github/workflows/simple-ci.yml`): ✅ Works without AWS credentials
- **Full CI/CD** (`.github/workflows/ci-cd.yml`): ⚠️ Requires AWS credentials and infrastructure

The simple CI workflow will run basic tests and Docker builds, while the full CI/CD workflow will deploy to AWS once the secrets are added and infrastructure is ready.