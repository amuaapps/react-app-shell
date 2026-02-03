# GitHub Secrets Configuration

This document lists all GitHub secrets and variables required for CI/CD deployment.

## Required Secrets

### Azure Authentication (OIDC)

These secrets are required for authenticating to Azure using OpenID Connect (OIDC).

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AZURE_CLIENT_ID` | Service Principal Application (Client) ID | Azure Portal → App Registrations → Your App → Overview |
| `AZURE_TENANT_ID` | Azure AD Tenant ID | Azure Portal → Azure Active Directory → Overview |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | Azure Portal → Subscriptions |

**Setup Instructions:**
1. Create a service principal with federated credentials for GitHub Actions
2. Grant it Contributor role on your resource group
3. Add the three secrets above to your GitHub repository

**Reference:** [Azure OIDC with GitHub Actions](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure)

### Azure Resources

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AZURE_RESOURCE_GROUP_NAME` | Resource group name | `rg-react-app-shell-dev` |
| `AZURE_CONTAINER_APPS_ENVIRONMENT_NAME` | Container Apps Environment name | `cae-react-shell-dev` |
| `AZURE_CONTAINER_APP_NAME` | Container App name | `ca-react-shell-dev` |

### GitHub Packages

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `NPM_PACKAGE_TOKEN` | GitHub Personal Access Token with `read:packages` scope | GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens |

**Important:** This must be a **long-lived token**, not the ephemeral `GITHUB_TOKEN`. The Container App stores these credentials and uses them to pull images when activating revisions.

### Analytics (Optional)

| Secret Name | Description | Required | Default Behavior |
|-------------|-------------|----------|------------------|
| `AZURE_KEYVAULT_NAME` | Name of Azure Key Vault containing analytics secrets | No | Analytics deployed without authentication |

**To enable analytics authentication:**
1. Create an Azure Key Vault (or use existing)
2. Add a secret named `analytics-write-key` with your analytics service write key
3. Grant the service principal "Key Vault Secrets User" role on the Key Vault
4. Add `AZURE_KEYVAULT_NAME` secret to GitHub with the Key Vault name

**Without this secret:** The app will deploy successfully but analytics events won't be authenticated.

## Required Variables

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `AZURE_REGION` | Azure region for deployment | `northeurope` |

## Environment-Specific Secrets

Secrets should be configured at the **environment level** in GitHub (not repository level) for proper isolation:

- **dev** environment
- **staging** environment  
- **prod** environment

**To configure:**
1. Go to your GitHub repository
2. Settings → Environments
3. Create/select environment (dev, staging, prod)
4. Add secrets specific to that environment

## Verification

To verify your secrets are configured correctly:

```bash
# Check if secrets are accessible in workflow
gh secret list

# Check environment-specific secrets
gh secret list --env dev
gh secret list --env staging
gh secret list --env prod
```

## Security Best Practices

1. **Never commit secrets to source control**
2. **Use environment-specific secrets** for dev/staging/prod isolation
3. **Rotate secrets regularly** (especially NPM_PACKAGE_TOKEN)
4. **Use Key Vault** for sensitive runtime secrets (like analytics write key)
5. **Grant least privilege** - service principal should only have access to required resources
6. **Use OIDC** instead of service principal secrets when possible

## Troubleshooting

### "Login failed with Error: Using auth-type: SERVICE_PRINCIPAL. Not all values are present"

**Cause:** Missing or incorrect Azure authentication secrets  
**Fix:** Verify `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` are set in the environment

### "argument --vault-name: expected one argument"

**Cause:** `AZURE_KEYVAULT_NAME` secret is not configured  
**Fix:** Either:
- Add the secret to enable analytics authentication, OR
- Accept that analytics will deploy without authentication (warning will be shown)

### "Failed to pull image"

**Cause:** Invalid or expired `NPM_PACKAGE_TOKEN`  
**Fix:** Generate a new Personal Access Token with `read:packages` scope
