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

**Required for all environments:**
- `AZURE_CLIENT_ID`: Service principal application (client) ID
- `AZURE_TENANT_ID`: Azure AD tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID
- `NPM_PACKAGE_TOKEN`: Token for accessing private npm packages

**Environment-specific secrets** (configure per environment: dev, staging, prod):
- `AZURE_RESOURCE_GROUP_NAME`: Name of the resource group
- `AZURE_REGION`: Azure region (e.g., eastus, westeurope)
- `AZURE_CONTAINER_APPS_ENVIRONMENT_NAME`: Name for the Container Apps Environment
- `AZURE_CONTAINER_APP_NAME`: Name for the Container App

## Deployment

Deployment is automated via GitHub Actions. See `.github/workflows/` for CI/CD pipelines.
