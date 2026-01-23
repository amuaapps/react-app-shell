# Azure Deployment Guide

## Quick Start

### 1. Prerequisites Checklist

- [ ] Azure subscription with Contributor access
- [ ] Resource group created
- [ ] Service principal with OIDC configured
- [ ] GitHub secrets configured
- [ ] Docker installed (for local testing)

### 2. First-Time Setup

```bash
# Create resource group
az group create \
  --name rg-shell-prod \
  --location eastus

# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-shell" \
  --role contributor \
  --scopes /subscriptions/<sub-id>/resourceGroups/rg-shell-prod

# Configure OIDC (save the output from above)
az ad app federated-credential create \
  --id <app-id> \
  --parameters @oidc-config.json
```

### 3. Deploy via GitHub Actions

**Automatic Deployment (Recommended):**
- Push to `develop` branch → Deploys to dev (0% traffic)
- Push to `staging` branch → Deploys to staging (0% traffic)
- Push to `main` branch → Deploys to prod + switches traffic to 100%

**Manual Deployment:**
1. Navigate to **Actions** → **CI/CD Pipeline**
2. Click **Run workflow**
3. Configure:
   - Environment: `dev`, `staging`, or `prod`
   - Deploy enabled: `true`
   - Revision label: `blue` or `green`
   - Initial traffic weight: `0` (for testing) or `100` (immediate switch)
   - Enable traffic switch: `true` to auto-switch after verification

### 4. Verify Deployment

```bash
# Get the URL
az containerapp show \
  --name <app-name> \
  --resource-group <rg-name> \
  --query properties.configuration.ingress.fqdn \
  --output tsv

# Test the endpoint
curl https://<fqdn>/health
```

## Blue/Green Deployment Workflow

### Stage 1: Deploy Blue (Initial)

```yaml
Environment: prod
Revision Label: blue
Traffic Weight: 100
```

Result: 100% traffic to blue revision

### Stage 2: Deploy Green (Canary)

```yaml
Environment: prod
Revision Label: green
Traffic Weight: 0
```

Result:
- Blue: 100% traffic
- Green: 0% traffic (available for testing at green-specific URL)

### Stage 3: Test Green

```bash
# Access green revision directly
curl https://green---<app-fqdn>

# Run smoke tests
npm run test:e2e -- --baseUrl=https://green---<app-fqdn>
```

### Stage 4: Gradual Rollout

```bash
# 10% to green
az containerapp ingress traffic set \
  --name <app-name> \
  --resource-group <rg-name> \
  --revision-weight blue=90 green=10

# Monitor metrics, then increase
# 50% to green
az containerapp ingress traffic set \
  --revision-weight blue=50 green=50

# 100% to green (complete cutover)
az containerapp ingress traffic set \
  --revision-weight green=100
```

### Stage 5: Cleanup Old Revision (Optional)

```bash
# Deactivate blue revision
az containerapp revision deactivate \
  --name <app-name> \
  --resource-group <rg-name> \
  --revision <blue-revision-name>
```

## Rollback Procedures

### Immediate Rollback

```bash
# Shift all traffic back to previous revision
az containerapp ingress traffic set \
  --name <app-name> \
  --resource-group <rg-name> \
  --revision-weight blue=100 green=0
```

### Rollback via GitHub Actions

1. Go to **Actions** → **Deploy to Azure Container Apps**
2. Re-run the previous successful workflow
3. Or deploy with previous image tag:
   ```yaml
   Environment: prod
   Revision Label: blue
   Traffic Weight: 100
   ```

## Monitoring and Observability

### View Application Logs

```bash
# Real-time logs
az containerapp logs show \
  --name <app-name> \
  --resource-group <rg-name> \
  --follow

# Logs for specific revision
az containerapp logs show \
  --name <app-name> \
  --resource-group <rg-name> \
  --revision <revision-name>
```

### Check Revision Health

```bash
# List all revisions with status
az containerapp revision list \
  --name <app-name> \
  --resource-group <rg-name> \
  --output table

# Get detailed revision info
az containerapp revision show \
  --name <app-name> \
  --resource-group <rg-name> \
  --revision <revision-name>
```

### Monitor Traffic Distribution

```bash
# View current traffic split
az containerapp ingress traffic show \
  --name <app-name> \
  --resource-group <rg-name>
```

## Local Testing

### Build Container Locally

```bash
# Build the image
docker build -t react-app-shell:local .

# Run locally
docker run -p 8080:80 react-app-shell:local

# Test
curl http://localhost:8080/health
open http://localhost:8080
```

### Test with Production-like Configuration

```bash
# Build with production settings
docker build \
  --build-arg NPM_PACKAGE_TOKEN=$NPM_PACKAGE_TOKEN \
  -t react-app-shell:test .

# Run with health checks
docker run -d \
  --name shell-test \
  --health-cmd="wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1" \
  --health-interval=30s \
  -p 8080:80 \
  react-app-shell:test

# Check health
docker ps
docker logs shell-test

# Cleanup
docker stop shell-test
docker rm shell-test
```

## Troubleshooting

### Issue: Container fails to start

**Symptoms**: Revision shows as "Failed" or "Provisioning"

**Solutions**:
1. Check container logs for errors
2. Verify image exists and is accessible
3. Check resource limits (CPU/memory)
4. Verify environment variables

```bash
# Check revision status
az containerapp revision show \
  --name <app-name> \
  --resource-group <rg-name> \
  --revision <revision-name>

# View system logs
az containerapp logs show \
  --name <app-name> \
  --resource-group <rg-name> \
  --type system
```

### Issue: Cannot access application

**Symptoms**: 404 or connection refused

**Solutions**:
1. Verify ingress is enabled and external
2. Check traffic weights
3. Verify DNS resolution

```bash
# Check ingress configuration
az containerapp ingress show \
  --name <app-name> \
  --resource-group <rg-name>

# Test DNS
nslookup <app-fqdn>

# Test with curl
curl -v https://<app-fqdn>
```

### Issue: Deployment takes too long

**Symptoms**: Deployment hangs or times out

**Solutions**:
1. Check if image pull is slow
2. Verify network connectivity
3. Check Container Apps Environment status

```bash
# Check environment status
az containerapp env show \
  --name <env-name> \
  --resource-group <rg-name>

# Check recent deployments
az deployment group list \
  --resource-group <rg-name> \
  --output table
```

## Security Best Practices

1. **Use OIDC**: Never store service principal keys in GitHub
2. **Least Privilege**: Grant only necessary permissions
3. **Environment Isolation**: Use separate environments for dev/staging/prod
4. **Image Scanning**: Scan container images for vulnerabilities
5. **HTTPS Only**: Container Apps enforces HTTPS by default
6. **Managed Identity**: Use for accessing Azure resources

## Cost Management

### Optimize Costs

```bash
# Scale down dev environment
az containerapp update \
  --name <app-name> \
  --resource-group <rg-name> \
  --min-replicas 0 \
  --max-replicas 1

# Check current costs
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31
```

### Cost Breakdown

- **Container Apps Environment**: ~$0/month (consumption-based)
- **Container App**: ~$0.000012/vCPU-second + ~$0.000004/GiB-second
- **Estimated monthly cost** (1 replica, 0.25 vCPU, 0.5 GiB):
  - Dev (8 hours/day): ~$5-10/month
  - Prod (24/7, 2 replicas): ~$30-50/month

## References

- [Azure Container Apps Pricing](https://azure.microsoft.com/pricing/details/container-apps/)
- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Container Apps Best Practices](https://learn.microsoft.com/azure/container-apps/best-practices)
