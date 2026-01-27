# GitHub Actions Workflows

## CI/CD Pipeline (`deploy.yml`)

Unified pipeline that handles testing, building, deployment, verification, and traffic switching.

### Workflow Stages

```
┌─────────┐     ┌─────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Test   │ --> │  Build  │ --> │ Deploy GREEN │ --> │ Verify + Switch     │
└─────────┘     └─────────┘     └──────────────┘     └─────────────────────┘
```

**4 Stages:**
1. **Test** - Quality checks and build validation
2. **Build** - Container image build and push to GHCR
3. **Deploy GREEN** - Deploy new revision with 0% traffic
4. **Verify + Switch** - Health checks, smoke tests, and traffic switch to 100%

#### Stage 1: Test
- Type checking (`npm run typecheck`)
- Linting (`npm run lint`)
- Code formatting check (`npm run format:check`)
- Unit tests (`npm run test:unit`)
- Integration tests (`npm run test:integration`)
- Build validation (`npm run build`)

**Runs on:** All workflow triggers (push to develop/release/main, workflow_dispatch)

#### Stage 2: Build
- Builds Docker container image
- Pushes to GitHub Container Registry (GHCR)
- Tags: `<env>-<sha>`, `<env>-latest`
- Outputs image reference for deployment stage

**Runs on:** After successful test stage

#### Stage 3: Deploy GREEN
- Deploys new GREEN revision to Azure Container Apps
- Auto-determines blue/green label (alternates from current active)
- Deploys with 0% or 100% traffic (100% on first deployment, 0% on subsequent)
- Uses OIDC for secure Azure authentication
- Outputs deployment metadata via artifact (`deploy-outputs.env`)

**Runs on:** After successful build
**Outputs (via artifact):**
- `GREEN_URL` - Direct URL to GREEN revision
- `GREEN_ID` - GREEN revision identifier
- `BLUE_ID` - Current BLUE revision identifier (if exists)
- `ACTIVE_URL` - Main application URL

#### Stage 4: Verify + Switch
- Downloads deployment outputs from artifact
- Loads GREEN_URL, GREEN_ID, BLUE_ID, ACTIVE_URL into environment
- Runs IaC security checks (Checkov on Bicep files)
- Health checks on GREEN revision URL (10 attempts, 10s intervals)
- Smoke tests (HTML response, React root element)
- Switches 100% traffic to GREEN revision
- Automatic rollback to BLUE on failure

**Runs on:** After successful deployment
**Artifact handoff:** Uses `deploy-outputs.env` artifact from Stage 3

### Trigger Modes

#### 1. Automatic (Branch Push)

**Develop Branch → dev environment:**
```bash
git push origin develop
```
- ✅ Runs tests
- ✅ Builds container
- ✅ Deploys GREEN to dev
- ✅ Verifies deployment
- ✅ Switches traffic to GREEN (100%)

**Release Branch → staging environment:**
```bash
git push origin release
```
- ✅ Runs tests
- ✅ Builds container
- ✅ Deploys GREEN to staging
- ✅ Verifies deployment
- ✅ Switches traffic to GREEN (100%)

**Main Branch → prod environment:**
```bash
git push origin main
```
- ✅ Runs tests
- ✅ Builds container
- ✅ Deploys GREEN to prod
- ✅ Verifies deployment
- ✅ Switches traffic to GREEN (100%)

**Note:** All branches automatically switch traffic after successful verification. Use GitHub Environment protection rules to require manual approval before deployment.

#### 2. Manual Dispatch

Navigate to **Actions** → **Deploy Pipeline** → **Run workflow**

**Parameters:**
- `environment`: Target environment (auto/dev/staging/prod)
  - **auto** (default): Automatically determines environment from branch
    - develop → dev
    - release → staging
    - main → prod
  - **dev/staging/prod**: Explicitly override environment
- `cloud`: Cloud provider (auto/azure/aws)
  - **auto** (default): Automatically selects based on `infra/` directory
    - Uses Azure if `infra/azure/main.bicep` exists
    - Uses AWS if `infra/aws/main.tf` exists (not yet implemented)
    - Fails if both or neither exist
  - **azure**: Explicitly use Azure
  - **aws**: Explicitly use AWS (not yet implemented)

**Example: Deploy current branch to dev on Azure**
```yaml
environment: dev
cloud: azure
```

**Example: Deploy from main to prod (auto-detect cloud)**
```yaml
environment: auto  # Will resolve to prod since on main branch
cloud: auto        # Will use Azure if infra/azure exists
```

**Example: Override environment (deploy develop branch to staging)**
```yaml
environment: staging  # Override: deploy develop to staging instead of dev
cloud: auto
```

#### 3. Pull Request

**Note:** The `deploy.yml` workflow does **not** run on pull requests. Use the separate `ci.yml` workflow for PR checks.

See `.github/workflows/ci.yml` for:
- Test & quality checks
- CodeQL security scanning
- Dependency vulnerability checks

### Blue/Green Deployment Workflow

#### How It Works

1. **First Deployment (no existing revisions):**
   - Deploys GREEN revision with 100% traffic
   - No BLUE revision exists yet
   - GREEN becomes active immediately

2. **Subsequent Deployments:**
   - Deploys new GREEN revision with 0% traffic
   - BLUE revision continues serving 100% traffic
   - GREEN is tested at: `https://green---<app-fqdn>`
   - After verification, traffic switches to GREEN (100%)
   - Previous GREEN becomes new BLUE

#### Scenario 1: Standard Deployment

1. **Push to branch:**
   ```bash
   git push origin release  # or develop/main
   ```

2. **Pipeline automatically:**
   - Runs all tests
   - Builds container image
   - Deploys GREEN revision (0% traffic if BLUE exists, 100% if first deployment)
   - Runs health checks on GREEN URL
   - Runs smoke tests (HTML, React root)
   - Switches 100% traffic to GREEN
   - Previous GREEN becomes new BLUE

3. **Automatic rollback on failure:**
   - If health checks or smoke tests fail
   - Pipeline automatically switches traffic back to BLUE
   - GREEN revision remains deployed for debugging

#### Scenario 2: Manual Verification Before Traffic Switch

If you want to manually verify before traffic switch, use GitHub Environment protection:

1. **Configure environment protection:**
   - Settings → Environments → Select environment (dev/staging/prod)
   - Enable "Required reviewers"
   - Add reviewers

2. **Push to branch:**
   ```bash
   git push origin release
   ```

3. **Pipeline pauses at deployment:**
   - Deploys GREEN with 0% traffic
   - Waits for manual approval
   - Test at: `https://green---<app-fqdn>`

4. **Manually verify:**
   ```bash
   curl https://green---<app-fqdn>
   # Run manual tests, check logs, etc.
   ```

5. **Approve deployment:**
   - Go to Actions → Workflow run → Review deployments → Approve
   - Pipeline continues with verification and traffic switch

#### Scenario 3: Manual Rollback

If you need to rollback after deployment:

```bash
az containerapp ingress traffic set \
  --name <app-name> \
  --resource-group <rg-name> \
  --revision-weight <blue-revision>=100
```

### Environment Protection

Configure GitHub Environments for deployment approval and safety:

**Settings → Environments → Create environment**

**dev environment:**
- No protection rules (auto-deploy)
- Deployment branches: develop

**staging environment:**
- Required reviewers: 1+ (recommended)
- Deployment branches: release
- Wait timer: optional

**prod environment:**
- Required reviewers: 2+ (recommended)
- Deployment branches: main
- Wait timer: 5 minutes (recommended)

**How it works:**
- Pipeline deploys GREEN revision with 0% traffic
- Waits for environment approval
- After approval, continues with verification and traffic switch
- Automatic rollback to BLUE if verification fails

### Secrets Required

**Repository Secrets:**
- `NPM_PACKAGE_TOKEN`: For private npm packages and container registry auth
- `AZURE_CLIENT_ID`: Service principal client ID (for OIDC)
- `AZURE_TENANT_ID`: Azure AD tenant ID (for OIDC)
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID (for OIDC)

**Environment Secrets (per environment: dev, staging, prod):**
- `AZURE_RESOURCE_GROUP_NAME`: Resource group name
- `AZURE_CONTAINER_APPS_ENVIRONMENT_NAME`: Container Apps Environment name
- `AZURE_CONTAINER_APP_NAME`: Container App name

**Environment Variables (per environment):**
- `AZURE_REGION`: Azure region (e.g., eastus)

**Note:** `NPM_PACKAGE_TOKEN` must be a long-lived GitHub PAT with `read:packages` scope. Ephemeral tokens (like `GITHUB_TOKEN`) do not work for Container Apps registry credentials.

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

### Artifact-Based Output Handoff

Stage 3 (Deploy GREEN) passes deployment metadata to Stage 4 (Verify + Switch) via GitHub Actions artifacts:

**Stage 3 outputs (uploaded as artifact `deploy-outputs.env`):**
```bash
GREEN_URL=https://green---app.region.azurecontainerapps.io
GREEN_ID=react-app-shell--green--abc123
BLUE_ID=react-app-shell--blue--xyz789
ACTIVE_URL=https://app.region.azurecontainerapps.io
```

**Stage 4 downloads and loads:**
```bash
# Download artifact
actions/download-artifact@v4

# Load into environment
source deploy-outputs.env
echo "GREEN_URL=$GREEN_URL" >> $GITHUB_ENV
# ... etc
```

**Why artifacts instead of job outputs:**
- Job outputs are limited to 1MB
- Artifacts support larger payloads
- More reliable for complex deployment metadata
- Easier to debug (can download artifact manually)

### Best Practices

1. **Always test in dev first** before promoting to staging/prod
2. **Use environment protection** for staging/prod deployments
3. **Monitor metrics** after traffic switches
4. **Keep old revisions** for quick rollback (BLUE is preserved)
5. **Review logs** before approving deployments
6. **Use branch protection** to enforce PR reviews before merging to release/main
7. **Test GREEN URL directly** before approving traffic switch (if using environment protection)
