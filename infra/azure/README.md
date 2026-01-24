# Azure Infrastructure - Container Apps with Blue/Green Deployment

This directory contains Bicep templates for deploying the React App Shell to Azure Container Apps with support for blue/green deployments.

## Architecture

- **Azure Container Apps**: Hosts the containerized shell application
- **Container Apps Environment**: Provides the managed infrastructure
- **Blue/Green Revisions**: Each deployment creates a new revision with configurable traffic splitting
- **GHCR Integration**: Pulls container images from GitHub Container Registry
- **OIDC Authentication**: Secure, keyless authentication from GitHub Actions

## Prerequisites

### Azure Resources

1. **Resource Group**: Must exist before deployment
   ```bash
   az group create --name <rg-name> --location <region>
   ```

2. **Service Principal with OIDC**: Configure federated credentials for GitHub Actions
   ```bash
   # Create service principal
   az ad sp create-for-rbac --name "github-actions-shell" \
     --role contributor \
     --scopes /subscriptions/<subscription-id>/resourceGroups/<rg-name>
   
   # Add federated credential
   az ad app federated-credential create \
     --id <app-id> \
     --parameters '{
       "name": "github-actions-shell",
       "issuer": "https://token.actions.githubusercontent.com",
       "subject": "repo:amuaapps/react-app-shell:environment:prod",
       "audiences": ["api://AzureADTokenExchange"]
     }'
   ```

### GitHub Secrets

Configure the following secrets in your GitHub repository (Settings → Secrets → Actions):

**Repository-level variables** (Settings → Secrets and variables → Actions → Variables):
- `AZURE_REGION`: Azure region (e.g., eastus, westeurope, northeurope)

**Repository-level secrets** (Settings → Secrets and variables → Actions → Repository secrets):
- `NPM_PACKAGE_TOKEN`: Token for accessing private npm packages

**Environment-specific secrets** (configure per environment: dev, staging, prod):
- `AZURE_CLIENT_ID`: Service principal application (client) ID
- `AZURE_TENANT_ID`: Azure AD tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID
- `AZURE_RESOURCE_GROUP_NAME`: Name of the resource group
- `AZURE_CONTAINER_APPS_ENVIRONMENT_NAME`: Name for the Container Apps Environment
- `AZURE_CONTAINER_APP_NAME`: Name for the Container App

**Important:** Environment-specific values must be configured as **Environment secrets**:
- Go to Settings → Environments → [environment-name] → Environment secrets
- Add each secret with its value for that specific environment

## Deployment

### Automated CI/CD Pipeline

The unified CI/CD pipeline (`.github/workflows/deploy.yml`) handles the complete flow:

**Pipeline Stages:**
1. **Test** - Lint, type check, unit & integration tests
2. **Build** - Build and push container image to GHCR
3. **Deploy** - Deploy new revision to Azure with 0% traffic
4. **Verify** - Health checks and smoke tests on new revision
5. **Traffic Switch** - Optionally switch 100% traffic to new revision

**Automatic Triggers:**
- **Push to develop** → Deploy to dev environment (0% traffic, manual switch required)
- **Push to staging** → Deploy to staging environment (0% traffic, manual switch required)
- **Push to main** → Deploy to prod + automatic traffic switch to 100%
- **Pull requests** → Run tests only (no deployment)

**Manual Deployment:**
- Go to **Actions** → **CI/CD Pipeline** → **Run workflow**
- Configure deployment options (environment, revision label, traffic settings)
