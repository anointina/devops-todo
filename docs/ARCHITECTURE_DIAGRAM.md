# DevOps Todo Application - Architecture Diagrams

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DEVOPS PIPELINE OVERVIEW                           │
└─────────────────────────────────────────────────────────────────────────────────┘

    Developer                 Version Control              CI/CD Pipeline
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  git    │                 │ webhook │                 │
│   Local Dev     │ push    │   GitHub Repo   │ ──────▶ │ GitHub Actions  │
│   Environment   │ ──────▶ │                 │         │                 │
│                 │         │   - Source Code │         │ - Build Image   │
└─────────────────┘         │   - Dockerfile  │         │ - Run Tests     │
                            │   - K8s Manifests│         │ - Push to Hub   │
                            └─────────────────┘         └─────────────────┘
                                                                  │
                                                                  │ push
                                                                  ▼
    End Users                Container Registry           Container Orchestration
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │ HTTP    │                 │  pull   │                 │
│   Web Browser   │ ◀────── │   Docker Hub    │ ◀────── │   Kubernetes    │
│                 │         │                 │         │   (Minikube)    │
│ - Todo Interface│         │ - Image Storage │         │                 │
│ - REST API Calls│         │ - Version Tags  │         │ - Pod Management│
└─────────────────┘         │ - Auto Updates  │         │ - Service Mesh  │
                            └─────────────────┘         │ - Load Balancing│
                                                        └─────────────────┘
```

## 🔧 Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

Frontend (Client-Side)              Backend (Server-Side)              Storage Layer
┌─────────────────┐                ┌─────────────────┐                ┌─────────────────┐
│                 │                │                 │                │                 │
│   HTML/CSS/JS   │                │   Node.js       │                │   In-Memory     │
│                 │                │   Express.js    │                │   Array         │
│ ┌─────────────┐ │   HTTP/JSON    │ ┌─────────────┐ │   JavaScript   │ ┌─────────────┐ │
│ │ index.html  │ │ ◀────────────▶ │ │   app.js    │ │ ◀────────────▶ │ │ todos[]     │ │
│ │ script.js   │ │   REST API     │ │             │ │   Operations   │ │             │ │
│ │ styles.css  │ │                │ │ - GET /todos│ │                │ │ - Create    │ │
│ └─────────────┘ │                │ │ - POST /todos│ │                │ │ - Read      │ │
│                 │                │ │ - Static    │ │                │ │ - Update    │ │
│ Features:       │                │ │   Serving   │ │                │ │ - Delete    │ │
│ - Add Todos     │                │ └─────────────┘ │                │ └─────────────┘ │
│ - View List     │                │                 │                │                 │
│ - Responsive UI │                │ Middleware:     │                │ Future:         │
│ - Error Handling│                │ - body-parser   │                │ - PostgreSQL    │
└─────────────────┘                │ - express.static│                │ - MongoDB       │
                                   └─────────────────┘                │ - Redis Cache   │
                                                                      └─────────────────┘
```

## 🐳 Container Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DOCKER CONTAINER STRUCTURE                         │
└─────────────────────────────────────────────────────────────────────────────────┘

Host Operating System
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                Docker Engine                                    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        devops-todo:latest Container                     │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Alpine Linux (Base OS)                      │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                Node.js Runtime (v20)                   │   │   │   │
│  │  │  │                                                         │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │            Application Layer                    │   │   │   │   │
│  │  │  │  │                                                 │   │   │   │   │
│  │  │  │  │  /usr/src/app/                                 │   │   │   │   │
│  │  │  │  │  ├── app.js (Express Server)                  │   │   │   │   │
│  │  │  │  │  ├── package.json                             │   │   │   │   │
│  │  │  │  │  ├── node_modules/                            │   │   │   │   │
│  │  │  │  │  └── ../public/ (Static Files)               │   │   │   │   │
│  │  │  │  │                                                 │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  Network: Bridge (Port 3000 exposed)                                   │   │
│  │  Storage: Container filesystem + Volume mounts                         │   │
│  │  Process: PID 1 - node app.js                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## ☸️ Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            KUBERNETES CLUSTER ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────────────┘

                                Minikube Cluster
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  Control Plane                                    Worker Node                   │
│  ┌─────────────────┐                             ┌─────────────────┐           │
│  │                 │                             │                 │           │
│  │ - API Server    │                             │   kubelet       │           │
│  │ - etcd          │                             │   kube-proxy    │           │
│  │ - Scheduler     │                             │   Container     │           │
│  │ - Controller    │                             │   Runtime       │           │
│  │   Manager       │                             │                 │           │
│  └─────────────────┘                             └─────────────────┘           │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                              Namespace: default                        │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Deployment: devops-todo                     │   │   │
│  │  │                                                                 │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                    ReplicaSet                           │   │   │   │
│  │  │  │                                                         │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                   Pod                           │   │   │   │   │
│  │  │  │  │                                                 │   │   │   │   │
│  │  │  │  │  ┌─────────────────────────────────────────┐   │   │   │   │   │
│  │  │  │  │  │         Container                       │   │   │   │   │   │
│  │  │  │  │  │                                         │   │   │   │   │   │
│  │  │  │  │  │  Image: devops-todo:latest             │   │   │   │   │   │
│  │  │  │  │  │  Port: 3000                            │   │   │   │   │   │
│  │  │  │  │  │  Labels: app=devops-todo               │   │   │   │   │   │
│  │  │  │  │  └─────────────────────────────────────────┘   │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                Service: devops-todo-service                    │   │   │
│  │  │                                                                 │   │   │
│  │  │  Type: NodePort                                                │   │   │
│  │  │  Selector: app=devops-todo                                     │   │   │
│  │  │  Port: 80 → TargetPort: 3000                                  │   │   │
│  │  │  NodePort: 30000-32767 (auto-assigned)                       │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

External Access:
┌─────────────────┐    NodePort     ┌─────────────────┐    Port 80    ┌─────────────────┐
│   End User      │ ──────────────▶ │   Service       │ ────────────▶ │      Pod        │
│   Browser       │                 │   Load Balancer │               │   Container     │
└─────────────────┘                 └─────────────────┘               │   Port 3000     │
                                                                      └─────────────────┘
```

## 🔄 CI/CD Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CI/CD PIPELINE DETAILED FLOW                       │
└─────────────────────────────────────────────────────────────────────────────────┘

Developer Workflow                    GitHub Actions Workflow
┌─────────────────┐                  ┌─────────────────────────────────────────────┐
│                 │                  │                                             │
│  1. Code        │                  │  Trigger: Push to main branch              │
│     Changes     │                  │                                             │
│                 │                  │  ┌─────────────────────────────────────┐   │
│  2. Git Commit  │                  │  │         Job 1: build-and-push      │   │
│                 │                  │  │                                     │   │
│  3. Git Push    │ ────────────────▶│  │  Step 1: Checkout source code      │   │
│     to main     │                  │  │  Step 2: Set up Docker Buildx      │   │
│                 │                  │  │  Step 3: Login to Docker Hub       │   │
└─────────────────┘                  │  │  Step 4: Build Docker image        │   │
                                     │  │  Step 5: Tag with commit SHA       │   │
                                     │  │  Step 6: Push to Docker Hub        │   │
                                     │  └─────────────────────────────────────┘   │
                                     │                                             │
                                     │  ┌─────────────────────────────────────┐   │
                                     │  │      Job 2: update-k8s (optional)  │   │
                                     │  │                                     │   │
                                     │  │  Step 1: Checkout source           │   │
                                     │  │  Step 2: Install kubectl           │   │
                                     │  │  Step 3: Configure kubeconfig      │   │
                                     │  │  Step 4: Update deployment image   │   │
                                     │  │  Step 5: Verify rollout status     │   │
                                     │  └─────────────────────────────────────┘   │
                                     └─────────────────────────────────────────────┘
                                                           │
                                                           ▼
Docker Hub Registry                    Kubernetes Cluster
┌─────────────────┐                  ┌─────────────────────────────────────────────┐
│                 │                  │                                             │
│  Image Storage  │                  │  Automatic Deployment Update               │
│                 │                  │                                             │
│  Repository:    │                  │  1. Pull new image from Docker Hub         │
│  user/devops-   │ ◀──────────────▶ │  2. Rolling update of pods                │
│  todo           │                  │  3. Health check verification              │
│                 │                  │  4. Traffic routing to new pods            │
│  Tags:          │                  │  5. Terminate old pods                     │
│  - latest       │                  │                                             │
│  - commit-sha   │                  └─────────────────────────────────────────────┘
│  - v1.0.0       │
└─────────────────┘
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYERS                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

Application Security              Container Security              Infrastructure Security
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│                 │              │                 │              │                 │
│ - Input         │              │ - Alpine Base   │              │ - RBAC          │
│   Validation    │              │   Image         │              │ - Network       │
│ - HTTPS Ready   │              │ - Minimal       │              │   Policies      │
│ - Error         │              │   Dependencies  │              │ - Secret        │
│   Handling      │              │ - Non-root      │              │   Management    │
│ - CORS          │              │   User Ready    │              │ - TLS           │
│   Configuration │              │ - Image         │              │   Encryption    │
│                 │              │   Scanning      │              │                 │
└─────────────────┘              └─────────────────┘              └─────────────────┘

CI/CD Security                   Registry Security                Monitoring Security
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│                 │              │                 │              │                 │
│ - GitHub        │              │ - Private       │              │ - Audit Logs    │
│   Secrets       │              │   Repositories  │              │ - Access        │
│ - Limited       │              │ - Vulnerability │              │   Monitoring    │
│   Permissions   │              │   Scanning      │              │ - Anomaly       │
│ - Audit Logs    │              │ - Image         │              │   Detection     │
│ - Branch        │              │   Signing       │              │ - Compliance    │
│   Protection    │              │ - Access        │              │   Reporting     │
│                 │              │   Control       │              │                 │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATA FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

User Interaction                 Frontend Processing              Backend Processing
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│                 │   User      │                 │   HTTP      │                 │
│  1. User types  │   Input     │  1. Capture     │   Request   │  1. Receive     │
│     todo text   │ ──────────▶ │     form data   │ ──────────▶ │     POST data   │
│                 │             │                 │             │                 │
│  2. Clicks Add  │             │  2. Validate    │             │  2. Validate    │
│     button      │             │     input       │             │     request     │
│                 │             │                 │             │                 │
│  3. Views       │   DOM       │  3. Send API    │             │  3. Create      │
│     updated     │   Update    │     request     │             │     todo object │
│     todo list   │ ◀────────── │                 │             │                 │
└─────────────────┘             │  4. Handle      │   HTTP      │  4. Store in    │
                                │     response    │   Response  │     memory      │
                                │                 │ ◀────────── │                 │
                                │  5. Update UI   │             │  5. Return      │
                                │                 │             │     JSON        │
                                └─────────────────┘             └─────────────────┘

API Endpoints:
GET  /todos     → Retrieve all todos
POST /todos     → Create new todo
GET  /*         → Serve static files
```

## 🚀 Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DEPLOYMENT STRATEGIES                              │
└─────────────────────────────────────────────────────────────────────────────────┘

Current: Rolling Update                    Future: Blue-Green Deployment
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│                                     │   │                                     │
│  Old Version (v1.0)                │   │  Blue Environment (Current)        │
│  ┌─────┐ ┌─────┐ ┌─────┐           │   │  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ Pod │ │ Pod │ │ Pod │           │   │  │ Pod │ │ Pod │ │ Pod │           │
│  │ v1  │ │ v1  │ │ v1  │           │   │  │ v1  │ │ v1  │ │ v1  │           │
│  └─────┘ └─────┘ └─────┘           │   │  └─────┘ └─────┘ └─────┘           │
│     │       │       │              │   │     │       │       │              │
│     ▼       ▼       ▼              │   │     ▼       ▼       ▼              │
│  ┌─────┐ ┌─────┐ ┌─────┐           │   │  ┌─────────────────────────┐       │
│  │ Pod │ │ Pod │ │ Pod │           │   │  │      Load Balancer      │       │
│  │ v2  │ │ v2  │ │ v2  │           │   │  │     (100% Blue)         │       │
│  └─────┘ └─────┘ └─────┘           │   │  └─────────────────────────┘       │
│                                     │   │                                     │
│  New Version (v2.0)                │   │  Green Environment (New)           │
│  - Gradual replacement              │   │  ┌─────┐ ┌─────┐ ┌─────┐           │
│  - Zero downtime                    │   │  │ Pod │ │ Pod │ │ Pod │           │
│  - Automatic rollback              │   │  │ v2  │ │ v2  │ │ v2  │           │
│                                     │   │  └─────┘ └─────┘ └─────┘           │
└─────────────────────────────────────┘   │  - Full environment switch         │
                                          │  - Instant rollback                │
                                          │  - Complete isolation              │
                                          └─────────────────────────────────────┘
```

---

## 📋 Architecture Benefits

### Scalability
- **Horizontal**: Easy pod replication
- **Vertical**: Resource limit adjustments
- **Auto-scaling**: HPA integration ready

### Reliability
- **Self-healing**: Kubernetes pod management
- **Health checks**: Liveness and readiness probes
- **Rolling updates**: Zero-downtime deployments

### Maintainability
- **Infrastructure as Code**: Version-controlled configurations
- **Automated deployments**: Consistent environment setup
- **Monitoring ready**: Observability integration points

### Security
- **Container isolation**: Process and network separation
- **Secret management**: Encrypted credential storage
- **Minimal attack surface**: Alpine Linux base image

This architecture provides a solid foundation for a production-ready application with room for growth and enhancement.