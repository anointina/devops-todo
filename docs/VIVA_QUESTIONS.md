# DevOps Todo Application - Viva Questions & Answers

## 📋 Table of Contents
1. [Application Development](#application-development)
2. [Docker & Containerization](#docker--containerization)
3. [Kubernetes & Orchestration](#kubernetes--orchestration)
4. [CI/CD & GitHub Actions](#cicd--github-actions)
5. [DevOps Concepts](#devops-concepts)
6. [Troubleshooting & Debugging](#troubleshooting--debugging)
7. [Security & Best Practices](#security--best-practices)
8. [Performance & Optimization](#performance--optimization)

---

## Application Development

### Q1: Explain the architecture of your Todo application.
**Answer**: The application follows a client-server architecture with:
- **Frontend**: HTML/CSS/JavaScript SPA that communicates with backend via REST API
- **Backend**: Node.js Express server providing REST endpoints for todo operations
- **Storage**: In-memory array for demonstration (easily replaceable with database)
- **Communication**: JSON-based API with GET/POST endpoints

### Q2: Why did you choose Express.js for the backend?
**Answer**: Express.js was chosen because:
- Lightweight and fast for REST API development
- Excellent middleware ecosystem (body-parser for JSON handling)
- Simple static file serving for frontend integration
- Minimal setup required for demonstration purposes
- Wide industry adoption and community support

### Q3: How does your frontend communicate with the backend?
**Answer**: The frontend uses the Fetch API for asynchronous communication:
- GET `/todos` - Retrieves all todos
- POST `/todos` - Creates new todos with JSON payload
- Error handling with try-catch and response status checking
- Dynamic DOM updates based on API responses

---

## Docker & Containerization

### Q4: Walk me through your Dockerfile. Why these specific choices?
**Answer**: 
```dockerfile
FROM node:20-alpine    # Minimal, secure base image
WORKDIR /usr/src/app   # Consistent working directory
COPY package*.json ./  # Copy dependencies first for layer caching
RUN npm ci --only=production  # Fast, reliable installs
COPY app/ ./           # Copy application code
EXPOSE 3000           # Document port usage
CMD ["node","app.js"] # Start application
```
**Rationale**: Layer caching optimization, security with Alpine, production dependencies only.

### Q5: What are the benefits of using Alpine Linux as base image?
**Answer**:
- **Size**: ~5MB vs ~100MB+ for full distributions
- **Security**: Minimal attack surface, fewer vulnerabilities
- **Performance**: Faster image pulls and container startup
- **Maintenance**: Regular security updates, stable base

### Q6: How would you optimize this Dockerfile further?
**Answer**:
- Multi-stage builds to separate build and runtime environments
- Non-root user for security: `USER node`
- Health checks: `HEALTHCHECK CMD curl -f http://localhost:3000/`
- Build arguments for configurable versions
- .dockerignore optimization to reduce build context

### Q7: Explain Docker layer caching and how you utilized it.
**Answer**: Docker caches each instruction as a layer. By copying `package*.json` first and running `npm ci`, dependency installation is cached separately from application code. This means code changes don't invalidate the dependency layer, significantly speeding up rebuilds.

---

## Kubernetes & Orchestration

### Q8: Explain your Kubernetes deployment strategy.
**Answer**: The deployment uses:
- **Deployment**: Manages pod lifecycle with 1 replica
- **Service**: NodePort type for external access (port 80 → 3000)
- **Labels**: `app: devops-todo` for service discovery
- **Container**: References Docker image with configurable tag

### Q9: What is the difference between Deployment and Pod in Kubernetes?
**Answer**:
- **Pod**: Smallest deployable unit, contains one or more containers
- **Deployment**: Higher-level controller that manages pods, provides:
  - Replica management
  - Rolling updates
  - Rollback capabilities
  - Self-healing (restarts failed pods)

### Q10: Why did you choose NodePort service type?
**Answer**: NodePort was chosen for:
- **External Access**: Allows access from outside the cluster
- **Simplicity**: Easy to test with Minikube
- **Development**: Suitable for development/demo environments
- **Alternative**: In production, would use LoadBalancer or Ingress

### Q11: How would you scale this application in Kubernetes?
**Answer**:
```yaml
spec:
  replicas: 3  # Horizontal scaling
  resources:   # Resource limits
    limits:
      cpu: 500m
      memory: 512Mi
```
Also implement:
- Horizontal Pod Autoscaler (HPA)
- Load balancing through service
- Health checks for proper scaling decisions

### Q12: What happens if a pod crashes in your deployment?
**Answer**: Kubernetes automatically:
1. Detects pod failure through health checks
2. Terminates the failed pod
3. Creates a new pod to maintain desired replica count
4. Updates service endpoints to route traffic to healthy pods
5. Logs events for debugging

---

## CI/CD & GitHub Actions

### Q13: Explain your CI/CD pipeline workflow.
**Answer**: The pipeline has two jobs:
1. **build-and-push**:
   - Checkout source code
   - Set up Docker Buildx
   - Login to Docker Hub using secrets
   - Build image with commit SHA tag
   - Push to registry

2. **update-k8s** (optional):
   - Install kubectl
   - Configure kubeconfig from secrets
   - Update deployment with new image

### Q14: Why do you tag images with commit SHA?
**Answer**:
- **Traceability**: Direct link between code and deployed image
- **Uniqueness**: Every commit gets unique tag
- **Rollback**: Easy to identify and rollback to specific versions
- **Debugging**: Clear correlation between issues and code changes

### Q15: How do you handle secrets in your pipeline?
**Answer**: Using GitHub Secrets:
- `REGISTRY_USER` and `REGISTRY_PASSWORD` for Docker Hub
- `KUBECONFIG` for Kubernetes access (base64 encoded)
- Secrets are encrypted and only accessible during workflow execution
- Never logged or exposed in workflow output

### Q16: What would you add to make this pipeline production-ready?
**Answer**:
- **Testing**: Unit tests, integration tests, security scans
- **Quality Gates**: Code coverage thresholds, linting
- **Environments**: Separate dev/staging/prod deployments
- **Approval**: Manual approval for production deployments
- **Monitoring**: Pipeline metrics and alerting
- **Rollback**: Automated rollback on deployment failure

---

## DevOps Concepts

### Q17: What DevOps principles does your project demonstrate?
**Answer**:
- **Automation**: Automated build, test, and deployment
- **Infrastructure as Code**: Kubernetes manifests, Dockerfile
- **Continuous Integration**: Automated builds on code changes
- **Continuous Deployment**: Automated deployment pipeline
- **Version Control**: Git-based workflow
- **Monitoring**: Ready for observability integration

### Q18: How does containerization support DevOps practices?
**Answer**:
- **Consistency**: Same environment across dev/test/prod
- **Portability**: Runs anywhere Docker is supported
- **Scalability**: Easy horizontal scaling
- **Isolation**: Application dependencies contained
- **Speed**: Fast deployment and rollback
- **Resource Efficiency**: Better resource utilization

### Q19: What is Infrastructure as Code and how do you implement it?
**Answer**: IaC treats infrastructure configuration as code:
- **Kubernetes Manifests**: Declarative infrastructure definition
- **Dockerfile**: Containerization configuration
- **Version Control**: All configurations in Git
- **Reproducibility**: Consistent environment creation
- **Automation**: Infrastructure changes through CI/CD

---

## Troubleshooting & Debugging

### Q20: How would you debug if the application is not accessible?
**Answer**: Systematic debugging approach:
1. **Check Pod Status**: `kubectl get pods`
2. **Examine Logs**: `kubectl logs deployment/devops-todo`
3. **Verify Service**: `kubectl get services`
4. **Test Connectivity**: `kubectl port-forward`
5. **Check Events**: `kubectl describe pod <pod-name>`
6. **Container Health**: `docker exec -it <container> sh`

### Q21: What if the Docker build fails?
**Answer**:
1. **Check Dockerfile syntax** and instruction order
2. **Verify base image** availability and version
3. **Check build context** and .dockerignore
4. **Examine build logs** for specific error messages
5. **Test locally** before pushing to CI/CD
6. **Validate dependencies** in package.json

### Q22: How would you troubleshoot CI/CD pipeline failures?
**Answer**:
1. **Check workflow logs** in GitHub Actions
2. **Verify secrets** are properly configured
3. **Test Docker commands** locally
4. **Validate YAML syntax** in workflow file
5. **Check permissions** for Docker Hub and Kubernetes
6. **Review recent changes** that might have broken the pipeline

---

## Security & Best Practices

### Q23: What security measures have you implemented?
**Answer**:
- **Minimal Base Image**: Alpine Linux reduces attack surface
- **Secret Management**: GitHub Secrets for credentials
- **Production Dependencies**: Only necessary packages installed
- **Container Isolation**: Kubernetes namespace isolation
- **Network Policies**: Service-based communication
- **Image Scanning**: Ready for vulnerability scanning integration

### Q24: How would you improve security further?
**Answer**:
- **Non-root User**: Run container as non-privileged user
- **Image Scanning**: Integrate Trivy or similar tools
- **RBAC**: Kubernetes Role-Based Access Control
- **Network Policies**: Restrict pod-to-pod communication
- **Secrets Encryption**: Encrypt secrets at rest
- **Regular Updates**: Automated dependency updates

### Q25: What are some Docker security best practices?
**Answer**:
- Use official, minimal base images
- Don't run as root user
- Scan images for vulnerabilities
- Use multi-stage builds
- Minimize installed packages
- Keep base images updated
- Use specific image tags, not 'latest'
- Implement health checks

---

## Performance & Optimization

### Q26: How would you optimize application performance?
**Answer**:
- **Database**: Replace in-memory storage with persistent database
- **Caching**: Implement Redis for frequently accessed data
- **CDN**: Use CDN for static assets
- **Compression**: Enable gzip compression
- **Connection Pooling**: Database connection optimization
- **Load Balancing**: Distribute traffic across multiple instances

### Q27: How would you monitor this application in production?
**Answer**:
- **Metrics**: Prometheus for application and infrastructure metrics
- **Logging**: Centralized logging with ELK stack
- **Tracing**: Distributed tracing with Jaeger
- **Alerting**: Grafana alerts for critical issues
- **Health Checks**: Kubernetes liveness and readiness probes
- **APM**: Application Performance Monitoring tools

### Q28: What would you do to handle increased traffic?
**Answer**:
- **Horizontal Scaling**: Increase pod replicas
- **Auto-scaling**: Implement HPA based on CPU/memory
- **Load Balancing**: Use Kubernetes service load balancing
- **Database Scaling**: Read replicas, connection pooling
- **Caching**: Implement application-level caching
- **CDN**: Offload static content delivery

---

## Bonus Questions

### Q29: How would you implement blue-green deployment?
**Answer**: Blue-green deployment involves:
- Two identical production environments (blue/green)
- Deploy new version to inactive environment
- Test thoroughly in inactive environment
- Switch traffic from active to new environment
- Keep old environment as instant rollback option
- In Kubernetes: Use labels and selectors to switch traffic

### Q30: What would be your next steps to improve this project?
**Answer**:
1. **Testing**: Comprehensive test suite with Jest
2. **Database**: PostgreSQL with persistent volumes
3. **Monitoring**: Prometheus/Grafana stack
4. **Security**: Implement authentication and authorization
5. **Performance**: Add caching and optimization
6. **Documentation**: API documentation with Swagger
7. **Infrastructure**: Terraform for infrastructure management

---

## 💡 Interview Tips

### Technical Demonstration
- Be prepared to show the running application
- Demonstrate the CI/CD pipeline in action
- Walk through the code and explain design decisions
- Show troubleshooting skills with live debugging

### Communication Points
- Emphasize learning journey and problem-solving approach
- Discuss challenges faced and how you overcame them
- Show understanding of production considerations
- Demonstrate knowledge of industry best practices

### Portfolio Presentation
- Have the project running and accessible
- Prepare architecture diagrams
- Show GitHub repository with clean commit history
- Demonstrate both local and deployed versions