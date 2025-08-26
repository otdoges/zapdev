# 🚀 Docker & Kubernetes Deployment Guide for zapdev API Server

This guide covers deploying the zapdev API server using Docker and Kubernetes with production-ready configurations.

## 📦 Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured

### Quick Start with Docker Compose

1. **Set up environment variables:**
```bash
# Create .env file
cp env-template.txt .env

# Edit .env with your values
POSTHOG_API_KEY=your_posthog_key_here
POSTHOG_HOST=https://app.posthog.com
CORS_ORIGINS=https://zapdev.link,https://www.zapdev.link
```

2. **Start production server:**
```bash
docker-compose up zapdev-api -d
```

3. **Start development server:**
```bash
docker-compose up zapdev-api-dev -d
```

4. **View logs:**
```bash
docker-compose logs -f zapdev-api
```

### Manual Docker Commands

**Build and run production:**
```bash
# Build image
docker build -t zapdev/api:latest .

# Run container
docker run -d \
  --name zapdev-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e POSTHOG_API_KEY=your_key \
  -e CORS_ORIGINS=https://zapdev.link \
  zapdev/api:latest
```

**Build and run development:**
```bash
# Build dev image
docker build -f Dockerfile.dev -t zapdev/api:dev .

# Run dev container
docker run -d \
  --name zapdev-api-dev \
  -p 3001:3000 \
  -v $(pwd):/app \
  -e NODE_ENV=development \
  zapdev/api:dev
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, GKE, EKS, AKS, etc.)
- kubectl configured
- Helm (optional, for advanced deployments)

### Quick Deployment

1. **Create namespace and apply configuration:**
```bash
kubectl apply -f k8s-deployment.yaml
```

2. **Check deployment status:**
```bash
kubectl get all -n zapdev
kubectl get pods -n zapdev
```

3. **View logs:**
```bash
kubectl logs -f deployment/zapdev-api -n zapdev
```

### Step-by-Step Deployment

1. **Create namespace:**
```bash
kubectl create namespace zapdev
```

2. **Create ConfigMap:**
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: zapdev-api-config
  namespace: zapdev
data:
  NODE_ENV: "production"
  PORT: "3000"
  ENABLE_CLUSTERING: "false"
  ENABLE_ANALYTICS: "true"
  POSTHOG_HOST: "https://app.posthog.com"
  CORS_ORIGINS: "https://zapdev.link,https://www.zapdev.link"
  RATE_LIMIT: "1000"
  REQUEST_TIMEOUT: "30000"
EOF
```

3. **Create Secret (replace with your actual key):**
```bash
# Encode your PostHog API key
echo -n "your_posthog_key_here" | base64

# Create secret
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: zapdev-api-secrets
  namespace: zapdev
type: Opaque
data:
  POSTHOG_API_KEY: "eW91cl9wb3N0aG9nX2tleV9oZXJl" # Replace with your encoded key
EOF
```

4. **Deploy the application:**
```bash
kubectl apply -f k8s-deployment.yaml
```

### Scaling and Management

**Scale deployment:**
```bash
kubectl scale deployment zapdev-api --replicas=5 -n zapdev
```

**Update image:**
```bash
kubectl set image deployment/zapdev-api api=zapdev/api:v2 -n zapdev
```

**Rollback:**
```bash
kubectl rollout undo deployment/zapdev-api -n zapdev
```

**View deployment history:**
```bash
kubectl rollout history deployment/zapdev-api -n zapdev
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `ENABLE_CLUSTERING` | `false` | Enable multi-core processing |
| `ENABLE_ANALYTICS` | `true` | Enable PostHog tracking |
| `POSTHOG_API_KEY` | - | PostHog project key |
| `POSTHOG_HOST` | `https://app.posthog.com` | PostHog host URL |
| `CORS_ORIGINS` | `https://zapdev.link` | Allowed CORS origins |
| `RATE_LIMIT` | `1000` | Requests per minute per IP |
| `REQUEST_TIMEOUT` | `30000` | Request timeout in milliseconds |

### Resource Limits

**Docker:**
- Memory: No limit (configurable via docker run --memory)
- CPU: No limit (configurable via docker run --cpus)

**Kubernetes:**
- Memory requests: 256Mi, limits: 512Mi
- CPU requests: 250m, limits: 500m

## 📊 Monitoring & Health Checks

### Health Endpoint
```bash
# Check health
curl http://localhost:3000/health

# Expected response
{
  "status": "healthy",
  "uptime": 157834,
  "metrics": {
    "totalRequests": 1547,
    "successfulRequests": 1523,
    "failedRequests": 24,
    "averageResponseTime": 45.67
  }
}
```

### Kubernetes Probes
- **Liveness Probe**: `/health` endpoint every 10s
- **Readiness Probe**: `/health` endpoint every 5s
- **Startup Probe**: 30s initial delay

### Prometheus Metrics
- Scraping enabled on port 3000
- Metrics endpoint: `/metrics`
- Annotations configured for auto-discovery

## 🚀 Production Considerations

### Security
- Non-root user (UID 1000)
- Read-only root filesystem
- Dropped capabilities
- Security context configured

### High Availability
- 3 replicas minimum
- Rolling update strategy
- Pod disruption budget
- Horizontal pod autoscaling

### Networking
- ClusterIP service
- Ingress with TLS
- Rate limiting at ingress level
- SSL redirect enabled

### Storage
- Ephemeral logs volume
- Temporary files volume
- No persistent storage (stateless design)

## 🔍 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker logs zapdev-api
kubectl logs -f deployment/zapdev-api -n zapdev

# Check resource usage
docker stats zapdev-api
kubectl top pods -n zapdev
```

**Health check failures:**
```bash
# Test health endpoint manually
curl -v http://localhost:3000/health

# Check environment variables
docker exec zapdev-api env
kubectl exec deployment/zapdev-api -n zapdev -- env
```

**PostHog integration issues:**
```bash
# Verify API key
echo $POSTHOG_API_KEY

# Check network connectivity
docker exec zapdev-api curl -I https://app.posthog.com
```

### Debug Commands

**Docker:**
```bash
# Enter container
docker exec -it zapdev-api sh

# Check processes
docker exec zapdev-api ps aux

# Check file permissions
docker exec zapdev-api ls -la /app
```

**Kubernetes:**
```bash
# Enter pod
kubectl exec -it deployment/zapdev-api -n zapdev -- sh

# Check events
kubectl get events -n zapdev

# Describe resources
kubectl describe pod -l app=zapdev-api -n zapdev
```

## 📈 Performance Tuning

### Docker Optimizations
- Multi-stage builds
- Layer caching
- Alpine base image
- Production-only dependencies

### Kubernetes Optimizations
- Resource requests/limits
- Horizontal pod autoscaling
- Pod disruption budgets
- Rolling update strategies

### Application Optimizations
- Clustering disabled (K8s handles scaling)
- Health check optimization
- Resource monitoring
- Graceful shutdown

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Kubernetes
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build and push Docker image
      run: |
        docker build -t zapdev/api:${{ github.sha }} .
        docker push zapdev/api:${{ github.sha }}
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/zapdev-api api=zapdev/api:${{ github.sha }} -n zapdev
        kubectl rollout status deployment/zapdev-api -n zapdev
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Bun Runtime](https://bun.sh/)
- [PostHog Analytics](https://posthog.com/)

---

**🎉 Your zapdev API server is now ready for production deployment!**

For support or questions, check the main README or create an issue in the repository.
