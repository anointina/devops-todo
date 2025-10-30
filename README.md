# DevOps Todo Application

A comprehensive DevOps project demonstrating modern containerization, orchestration, and CI/CD practices using a full-stack Todo application.

## 🚀 Latest Updates
- ✅ Fixed GitHub Actions CI/CD pipeline with proper permissions
- ✅ Enhanced security scanning with proper SARIF upload
- ✅ Improved AWS deployment with cluster readiness checks
- ✅ Added comprehensive error handling and cleanup processes

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│   Docker Hub    │
│                 │    │     CI/CD        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        │
┌─────────────────┐    ┌──────────────────┐             │
│   Developer     │───▶│   Local Docker   │             │
│   Environment   │    │   Container      │             │
└─────────────────┘    └──────────────────┘             │
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Users       │◀───│  Kubernetes      │◀───│   Deployment    │
│                 │    │   (Minikube)     │    │   Automation    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Features

- **Full-Stack Application**: Node.js/Express backend with HTML/CSS/JS frontend
- **Containerization**: Docker-based deployment with optimized Alpine Linux image
- **Orchestration**: Kubernetes deployment with service discovery
- **CI/CD Pipeline**: Automated build, test, and deployment using GitHub Actions
- **Container Registry**: Automated image publishing to Docker Hub
- **Local Development**: Easy setup with Docker and Minikube

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Containerization** | Docker, Docker Hub |
| **Orchestration** | Kubernetes, Minikube |
| **CI/CD** | GitHub Actions |
| **Version Control** | Git, GitHub |
| **Development** | VS Code, PowerShell |

## 📁 Project Structure

```
devops-todo/
├── app/
│   ├── app.js              # Express server
│   ├── package.json        # Node.js dependencies
│   └── package-lock.json   # Dependency lock file
├── public/
│   ├── index.html          # Frontend UI
│   ├── script.js           # Client-side logic
│   └── styles.css          # Styling
├── k8s/
│   ├── deployment.yaml     # Kubernetes deployment
│   └── service.yaml        # Kubernetes service
├── .github/workflows/
│   └── ci-cd.yml          # GitHub Actions pipeline
├── Dockerfile              # Container configuration
└── .dockerignore          # Docker ignore rules
```

## 🔧 Local Development

### Prerequisites
- Node.js (v20+)
- Docker Desktop
- Minikube
- kubectl

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devops-todo
   ```

2. **Run locally with Node.js**
   ```bash
   cd app
   npm install
   npm start
   ```
   Visit: http://localhost:3000

3. **Run with Docker**
   ```bash
   docker build -t devops-todo:local .
   docker run -p 3000:3000 devops-todo:local
   ```

4. **Deploy to Kubernetes**
   ```bash
   minikube start
   kubectl apply -f k8s/
   kubectl port-forward service/devops-todo-service 3000:80
   ```

## 🚀 CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Triggers** on push to `main` branch
2. **Builds** Docker image with commit SHA tag
3. **Pushes** to Docker Hub registry
4. **Updates** Kubernetes deployment (optional stage)

### Required Secrets
- `REGISTRY_USER`: Docker Hub username
- `REGISTRY_PASSWORD`: Docker Hub password/token
- `KUBECONFIG`: Base64 encoded kubeconfig (for auto-deployment)

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/todos` | Retrieve all todos |
| POST | `/todos` | Create new todo |
| GET | `/*` | Serve frontend (SPA routing) |

## 📊 Monitoring & Verification

### Docker Commands
```bash
# Check running containers
docker ps

# View logs
docker logs <container-id>

# Access container shell
docker exec -it <container-id> sh
```

### Kubernetes Commands
```bash
# Check pods
kubectl get pods

# Check services
kubectl get services

# View logs
kubectl logs deployment/devops-todo

# Port forwarding
kubectl port-forward service/devops-todo-service 3000:80
```

## 🔒 Security Features

- **Alpine Linux**: Minimal attack surface
- **Non-root user**: Container runs with limited privileges
- **Secrets management**: Sensitive data stored in GitHub Secrets
- **Network policies**: Kubernetes service isolation

## 📈 Performance Optimizations

- **Multi-stage builds**: Optimized Docker image size
- **npm ci**: Faster, reliable dependency installation
- **Static file serving**: Efficient asset delivery
- **Container resource limits**: Controlled resource usage

## 🎓 Learning Outcomes

This project demonstrates proficiency in:
- **Containerization** with Docker
- **Container orchestration** with Kubernetes
- **CI/CD pipeline** design and implementation
- **Infrastructure as Code** practices
- **DevOps automation** workflows
- **Full-stack development** skills

## 🚀 Future Enhancements

- [ ] Add comprehensive test suite
- [ ] Implement database persistence (MongoDB/PostgreSQL)
- [ ] Add monitoring with Prometheus/Grafana
- [ ] Implement logging with ELK stack
- [ ] Add Helm charts for deployment
- [ ] Implement blue-green deployment strategy
- [ ] Add security scanning in CI/CD
- [ ] Implement auto-scaling policies

## 📝 License

This project is created for educational and portfolio purposes.

---

**Built with ❤️ for DevOps learning and demonstration**