# Deployment Guide - React App Shell

This document describes the deployment pipeline for the React App Shell to Azure Container Apps.

## Table of Contents
- [Overview](#overview)
- [Pipeline Structure](#pipeline-structure)
- [Prerequisites](#prerequisites)
- [Workflows](#workflows)
- [Deployment Process](#deployment-process)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

The React App Shell uses a **4-stage blue/green deployment pipeline** that ensures zero-downtime deployments with automatic rollback on failure.

**Key Features:**
- ✅ Zero-downtime deployments
- ✅ Automatic blue/green traffic switching
- ✅ Health checks and smoke tests before traffic switch
- ✅ Automatic rollback on verification failure
- ✅ IaC security scanning (Checkov)
- ✅ Script-based deployment (testable and reusable)

---

## Pipeline Structure

### Branch → Environment Mapping

| Branch     | Environment | Auto-Deploy |
|------------|-------------|-------------|
| `develop`  | `dev`       | ✅ Yes      |
| `release`  | `staging`   | ✅ Yes      |
| `main`     | `prod`      | ✅ Yes      |

### 4-Stage Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 0: Context & Cloud Selection                          │
│ - Resolve environment from branch                           │
│ - Determine cloud provider (Azure only for now)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: Test & Quality Checks                              │
│ - npm ci, typecheck, lint, format check                     │
│ - Unit tests, integration tests                             │
│ - Build application                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: Build Container Image                              │
│ - Build Docker image                                         │
│ - Push to GHCR (ghcr.io/amuaapps/react-app-shell)          │
│ - Tag: {env}-{sha} and {env}-latest                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 3: Deploy GREEN Revision (0% traffic)                 │
│ - Fetch existing traffic rules                              │
│ - Deploy new revision with 0% traffic                       │
│ - Preserve existing BLUE traffic (100%)                     │
│ - Output: green_url, green_id, blue_id, active_url         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 4: Verify GREEN + Switch Traffic                      │
│ - IaC security check (Checkov on Bicep)                     │
│ - Health check GREEN revision (10 attempts)                 │
│ - Smoke tests (HTML + React root element)                   │
│ - Switch traffic: BLUE 0% → GREEN 100%                      │
│ - Rollback to BLUE on any failure                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### GitHub Secrets (per environment)

Configure these secrets in GitHub repository settings under **Environments** (`dev`, `staging`, `prod`):

| Secret Name                              | Description                          | Example                                      |
|------------------------------------------|--------------------------------------|----------------------------------------------|
| `AZURE_CLIENT_ID`                        | Azure service principal client ID    | `12345678-1234-1234-1234-123456789abc`      |
| `AZURE_TENANT_ID`                        | Azure tenant ID                      | `87654321-4321-4321-4321-cba987654321`      |
| `AZURE_SUBSCRIPTION_ID`                  | Azure subscription ID                | `abcdef12-3456-7890-abcd-ef1234567890`      |
| `AZURE_RESOURCE_GROUP_NAME`              | Resource group name                  | `rg-react-shell-dev`                         |
| `AZURE_CONTAINER_APPS_ENVIRONMENT_NAME`  | Container Apps environment name      | `cae-react-shell-dev`                        |
| `AZURE_CONTAINER_APP_NAME`               | Container App name                   | `ca-react-shell-dev`                         |
| `NPM_PACKAGE_TOKEN`                      | **CRITICAL:** GitHub PAT with `read:packages` scope. Used for both npm install during build AND Container App registry credentials. Must be long-lived (not `GITHUB_TOKEN`). | `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`           |

> **⚠️ Important:** `NPM_PACKAGE_TOKEN` must be a Personal Access Token with `read:packages` scope. Do NOT use the ephemeral `GITHUB_TOKEN` as it expires after the workflow completes, causing Container Apps to fail when pulling images during traffic switching.

### GitHub Variables (repository-level)

| Variable Name   | Description           | Example        |
|-----------------|-----------------------|----------------|
| `AZURE_REGION`  | Azure region          | `northeurope`  |

### Azure Infrastructure

The Container Apps environment must exist before first deployment. Create it manually or via separate infrastructure pipeline:

```bash
az containerapp env create \
  --name cae-react-shell-dev \
  --resource-group rg-react-shell-dev \
  --location northeurope
```

---

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Pull requests to `develop`, `release`, `main`

**Purpose:** Validate code quality without deploying

**Checks:**
- Type checking (`npm run typecheck`)
- Linting (`npm run lint`)
- Code formatting (`npm run format:check`)
- Unit tests (`npm run test:unit`)
- Integration tests (`npm run test:integration`)
- Security audit (`npm audit --audit-level=high`)
- CodeQL analysis (JavaScript/TypeScript)

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `develop`, `release`, `main` (automatic)
- Manual workflow dispatch (with environment and cloud selection)

**Jobs:**
1. `context` - Resolve environment from branch
2. `decide` - Determine cloud provider (Azure only)
3. `test` - Run all quality checks
4. `build` - Build and push container image
5. `deploy_azure` - Deploy GREEN revision (0% traffic)
6. `verify_switch_azure` - Verify and switch traffic

---

## Deployment Process

### Automatic Deployment (Push to Branch)

1. **Push to branch:**
   ```bash
   git push origin develop  # Deploys to dev
   git push origin release  # Deploys to staging
   git push origin main     # Deploys to prod
   ```

2. **Pipeline executes automatically:**
   - Tests run
   - Container image builds
   - GREEN revision deploys with 0% traffic
   - Health checks run against GREEN
   - Traffic switches to GREEN (100%)

### Manual Deployment (Workflow Dispatch)

1. Go to **Actions** → **Deploy Pipeline** → **Run workflow**
2. Select:
   - **Branch:** `develop`, `release`, or `main`
   - **Environment:** `auto` (recommended), `dev`, `staging`, or `prod`
   - **Cloud:** `auto` (recommended) or `azure`
3. Click **Run workflow**

### What Happens During Deployment

#### Stage 3: Deploy GREEN
```bash
# Script: scripts/ci/deploy-azure-green.sh

1. Determine current BLUE revision (active traffic > 0)
2. Toggle candidate label (blue → green or green → blue)
3. Fetch existing traffic rules from Container App
4. Deploy new revision via Bicep with:
   - candidateWeight: 0
   - existingTraffic: <current rules>
   - This preserves BLUE at 100%, adds GREEN at 0%
5. Output revision URLs and IDs
```

#### Stage 4: Verify & Switch
```bash
# Scripts: scripts/ci/switch-azure-bluegreen.sh, rollback-azure-bluegreen.sh

1. Run IaC security check (Checkov)
2. Health check GREEN URL (10 attempts, 10s intervals)
3. Smoke test GREEN (check HTML and React root)
4. Switch traffic: GREEN=100%, BLUE=0%
5. On failure: Rollback to BLUE=100%, GREEN=0%
```

---

## Rollback Procedures

### Automatic Rollback

If Stage 4 verification fails, the pipeline **automatically rolls back** to BLUE:

```bash
# Executed automatically on failure
scripts/ci/rollback-azure-bluegreen.sh
```

This restores traffic to the previous BLUE revision.

### Manual Rollback

If you need to manually rollback after a successful deployment:

1. **Identify revisions:**
   ```bash
   az containerapp revision list \
     --name $AZURE_CONTAINER_APP_NAME \
     --resource-group $AZURE_RESOURCE_GROUP_NAME \
     --query "[].{name:name, active:properties.active, traffic:properties.trafficWeight}" \
     -o table
   ```

2. **Switch traffic back to previous revision:**
   ```bash
   # Find the previous BLUE revision name
   BLUE_REVISION="ca-react-shell-dev--blue-20260125-123456"
   GREEN_REVISION="ca-react-shell-dev--green-20260125-130000"
   
   az containerapp ingress traffic set \
     --name $AZURE_CONTAINER_APP_NAME \
     --resource-group $AZURE_RESOURCE_GROUP_NAME \
     --revision-weight "${BLUE_REVISION}=100" "${GREEN_REVISION}=0"
   ```

3. **Verify:**
   ```bash
   curl https://your-app.azurecontainerapps.io
   ```

---

## Troubleshooting

### Common Issues

#### 1. Image Pull Authentication Errors During Traffic Switch

**Symptom:**
```
ERROR: Failed to provision revision for container app. 
Error details: Field 'template.containers.app.image' is invalid with details: 
'Invalid value: "ghcr.io/...": GET https:... DENIED: denied'
```

**Cause:** Container App is using expired `GITHUB_TOKEN` instead of long-lived `NPM_PACKAGE_TOKEN`.

**Solution:**
1. Verify `NPM_PACKAGE_TOKEN` secret exists in GitHub repository settings
2. Ensure it has `read:packages` scope
3. Confirm workflow uses `NPM_PACKAGE_TOKEN` for `REGISTRY_PASSWORD` (not `GITHUB_TOKEN`)

#### 2. Empty GREEN_URL in Verify Step

**Symptom:** Health check fails with `GREEN_URL=""` or empty URL.

**Cause:** Job outputs not properly passed between `deploy_azure` and `verify_switch_azure` jobs.

**Solution:** Deployment outputs are now passed via artifacts (`deploy-outputs.env` file) which is more reliable than GitHub Actions job outputs.

#### 3. Traffic Label Conflicts

**Symptom:**
```
ERROR: Traffic label 'green' is not unique
```

**Cause:** Existing traffic rules already contain the candidate label.

**Solution:** Deploy script now filters out the candidate label from existing traffic before deployment to avoid conflicts.

## Troubleshooting (Legacy)

### Deployment Fails at Stage 3

**Symptom:** `deploy_azure` job fails

**Common Causes:**
1. **Bicep validation error**
   - Check Bicep syntax
   - Verify parameter types match

2. **Image pull failure**
   - Verify image exists in GHCR
   - Check registry credentials

3. **Container Apps environment doesn't exist**
   - Create the environment first (see Prerequisites)

**Debug:**
```bash
# Check deployment logs
az deployment group show \
  --name deploy-ca-react-shell-dev-<timestamp> \
  --resource-group $AZURE_RESOURCE_GROUP_NAME \
  --query properties.error
```

### Deployment Fails at Stage 4 (Verification)

**Symptom:** `verify_switch_azure` job fails, automatic rollback occurs

**Common Causes:**
1. **Health check timeout**
   - Container startup is slow
   - Application has errors
   - Network connectivity issues

2. **Smoke test failure**
   - HTML structure changed
   - React root element missing

3. **IaC security check failure**
   - Checkov found security issues in Bicep

**Debug:**
```bash
# Check GREEN revision logs
az containerapp logs show \
  --name $AZURE_CONTAINER_APP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP_NAME \
  --revision <green-revision-name> \
  --tail 100

# Test GREEN URL manually
curl -v https://<green-revision-fqdn>
```

### Traffic Not Switching

**Symptom:** Deployment succeeds but traffic stays on old revision

**Causes:**
1. Stage 4 was skipped (check job conditions)
2. Switch script failed silently

**Fix:**
```bash
# Manually switch traffic
az containerapp ingress traffic set \
  --name $AZURE_CONTAINER_APP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP_NAME \
  --revision-weight "<green-revision>=100" "<blue-revision>=0"
```

### First Deployment Issues

**Symptom:** First deployment fails with traffic weight error

**Cause:** No existing revisions, but `existingTraffic` is not empty

**Fix:** The script handles this automatically by checking if the app exists. If issues persist:
```bash
# Verify Container App doesn't exist yet
az containerapp show \
  --name $AZURE_CONTAINER_APP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP_NAME
```

### AWS Deployment Attempted

**Symptom:** Pipeline fails with "AWS not implemented" error

**Cause:** AWS infrastructure detected or `cloud=aws` selected

**Fix:** Use `cloud=azure` or `cloud=auto` (which will select Azure)

---

## Monitoring Deployments

### View Pipeline Status

1. Go to **Actions** tab in GitHub
2. Click on latest workflow run
3. Expand jobs to see detailed logs

### View Container App Status

```bash
# List all revisions
az containerapp revision list \
  --name $AZURE_CONTAINER_APP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP_NAME \
  -o table

# Show traffic distribution
az containerapp ingress traffic show \
  --name $AZURE_CONTAINER_APP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP_NAME

# View logs
az containerapp logs show \
  --name $AZURE_CONTAINER_APP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP_NAME \
  --tail 100 \
  --follow
```

### Verify Deployment

```bash
# Check active URL
curl https://your-app.azurecontainerapps.io

# Check specific revision
curl https://your-app--green-20260125-123456.azurecontainerapps.io
```

---

## Security Considerations

1. **Secrets Management:**
   - All secrets stored in GitHub Environments
   - OIDC authentication (no long-lived credentials)
   - Registry passwords never logged

2. **IaC Security:**
   - Checkov scans Bicep templates before deployment
   - Pipeline fails if security issues found

3. **Network Security:**
   - Container Apps use HTTPS only
   - Private endpoints can be configured separately

4. **Image Security:**
   - Images scanned by GitHub's built-in scanning
   - Use `npm audit` in CI to catch vulnerabilities

---

## Related Documentation

- [Pipeline Contract](./pipeline-contract.md) - Standard pipeline structure
- [Infrastructure Contract](./infra-contract.md) - Bicep template requirements
- [README](../README.md) - General project documentation
- [agents.md](./agents.md) - Coding standards and CI/CD requirements
