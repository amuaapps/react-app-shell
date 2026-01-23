# GitHub Actions Workflows

## CI/CD Pipeline (`deploy.yml`)

Unified pipeline that handles testing, building, deployment, verification, and traffic switching.

### Workflow Stages

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────────────┐
│  Test   │ --> │  Build  │ --> │ Deploy  │ --> │ Verify  │ --> │ Traffic Switch  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────────────┘
```

#### Stage 1: Test
- Type checking (`npm run typecheck`)
- Linting (`npm run lint`)
- Code formatting check (`npm run format:check`)
- Unit tests (`npm run test:unit`)
- Integration tests (`npm run test:integration`)
- Build validation (`npm run build`)

**Runs on:** All pushes and pull requests

#### Stage 2: Build
- Builds Docker container image
- Pushes to GitHub Container Registry (GHCR)
- Tags: `<env>-<sha>`, `<env>-latest`, `<env>-<run-number>`

**Runs on:** Pushes to develop/staging/main, or manual dispatch with deploy enabled

#### Stage 3: Deploy
- Deploys new revision to Azure Container Apps
- Auto-determines blue/green label (alternates from current active)
- Deploys with 0% traffic by default (for testing)
- Uses OIDC for secure Azure authentication

**Runs on:** After successful build

#### Stage 4: Verify
- Health checks on new revision URL
- Smoke tests (health endpoint, HTML response)
- Waits for deployment to stabilize

**Runs on:** After successful deployment

#### Stage 5: Traffic Switch
- Switches 100% traffic to new revision
- Verifies active URL after switch
- Requires manual approval via GitHub Environment

**Runs on:** 
- Automatic for pushes to `main` branch
- Manual dispatch with `enable_traffic_switch: true`

### Trigger Modes

#### 1. Automatic (Branch Push)

**Develop Branch:**
```bash
git push origin develop
```
- ✅ Runs tests
- ✅ Builds container
- ✅ Deploys to dev (0% traffic)
- ✅ Verifies deployment
- ❌ No traffic switch (manual approval required)

**Staging Branch:**
```bash
git push origin staging
```
- ✅ Runs tests
- ✅ Builds container
- ✅ Deploys to staging (0% traffic)
- ✅ Verifies deployment
- ❌ No traffic switch (manual approval required)

**Main Branch:**
```bash
git push origin main
```
- ✅ Runs tests
- ✅ Builds container
- ✅ Deploys to prod (0% traffic)
- ✅ Verifies deployment
- ✅ **Automatic traffic switch to 100%**

#### 2. Manual Dispatch

Navigate to **Actions** → **CI/CD Pipeline** → **Run workflow**

**Parameters:**
- `environment`: Target environment (dev/staging/prod)
- `deploy_enabled`: Enable deployment (true/false)
- `revision_label`: Blue or green revision
- `initial_traffic_weight`: 0-100 (default: 0 for safe testing)
- `enable_traffic_switch`: Auto-switch traffic after verification

**Example: Deploy to staging with immediate traffic switch**
```yaml
environment: staging
deploy_enabled: true
revision_label: blue
initial_traffic_weight: 100
enable_traffic_switch: true
```

**Example: Deploy to prod for testing (no traffic)**
```yaml
environment: prod
deploy_enabled: true
revision_label: green
initial_traffic_weight: 0
enable_traffic_switch: false
```

#### 3. Pull Request

```bash
git push origin feature-branch
# Create PR to develop/staging/main
```
- ✅ Runs tests
- ❌ No build
- ❌ No deployment

### Blue/Green Deployment Workflow

#### Scenario 1: Safe Deployment with Manual Verification

1. **Deploy green revision with 0% traffic:**
   ```bash
   git push origin staging
   ```
   - Deploys green revision
   - 0% traffic (blue still serves 100%)
   - Test at: `https://green---<app-fqdn>`

2. **Manually verify green revision:**
   ```bash
   curl https://green---<app-fqdn>
   # Run manual tests, check logs, etc.
   ```

3. **Switch traffic via Azure CLI:**
   ```bash
   # Gradual rollout
   az containerapp ingress traffic set \
     --name <app-name> \
     --resource-group <rg-name> \
     --revision-weight blue=50 green=50
   
   # Complete cutover
   az containerapp ingress traffic set \
     --revision-weight green=100
   ```

#### Scenario 2: Automatic Deployment (Production)

1. **Merge to main:**
   ```bash
   git push origin main
   ```

2. **Pipeline automatically:**
   - Runs all tests
   - Builds container
   - Deploys new revision (0% traffic)
   - Verifies health
   - **Switches 100% traffic** (requires environment approval)

3. **Rollback if needed:**
   ```bash
   az containerapp ingress traffic set \
     --name <app-name> \
     --resource-group <rg-name> \
     --revision-weight <previous-revision>=100
   ```

### Environment Protection

Configure GitHub Environments for additional safety:

**Settings → Environments → Create environment**

**dev environment:**
- No protection rules (auto-deploy)

**staging environment:**
- Required reviewers: 1
- Deployment branches: staging

**prod environment:**
- Required reviewers: 2
- Deployment branches: main
- Wait timer: 5 minutes

**prod-traffic-switch environment:**
- Required reviewers: 1
- Deployment branches: main
- Used for traffic switching approval

### Secrets Required

**Repository Secrets:**
- `NPM_PACKAGE_TOKEN`: For private npm packages
- `AZURE_CLIENT_ID`: Service principal client ID
- `AZURE_TENANT_ID`: Azure AD tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID

**Environment Secrets (per environment):**
- `AZURE_RESOURCE_GROUP_NAME`: Resource group name
- `AZURE_REGION`: Azure region (e.g., eastus)
- `AZURE_CONTAINER_APPS_ENVIRONMENT_NAME`: Container Apps Environment name
- `AZURE_CONTAINER_APP_NAME`: Container App name

### Monitoring Workflow Runs

**View workflow runs:**
```
Repository → Actions → CI/CD Pipeline
```

**Check deployment status:**
```bash
az containerapp revision list \
  --name <app-name> \
  --resource-group <rg-name> \
  --output table
```

**View logs:**
```bash
az containerapp logs show \
  --name <app-name> \
  --resource-group <rg-name> \
  --follow
```

### Troubleshooting

**Build fails:**
- Check test output in workflow logs
- Verify NPM_PACKAGE_TOKEN is set
- Ensure all tests pass locally

**Deployment fails:**
- Check Azure credentials (OIDC configuration)
- Verify resource group and app names
- Check Bicep template validation

**Verification fails:**
- Check container logs in Azure
- Verify health endpoint returns 200
- Check if image was pushed to GHCR

**Traffic switch fails:**
- Verify revision is healthy
- Check current traffic distribution
- Ensure environment approval was granted

### Best Practices

1. **Always test in dev first** before promoting to staging/prod
2. **Use 0% traffic** for initial deployments to test safely
3. **Monitor metrics** after traffic switches
4. **Keep old revisions** for quick rollback
5. **Use environment protection** for prod deployments
6. **Review logs** before switching traffic
7. **Gradual rollout** for high-risk changes (10% → 50% → 100%)
