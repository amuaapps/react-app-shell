# Analytics Deployment Configuration

This document describes how to configure analytics for deployment to Azure Container Apps.

**Prerequisites:** See [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) for required GitHub secrets configuration.

## Environment Variables

The analytics system requires two environment variables to be configured:

### 1. VITE_ANALYTICS_SERVICE_URL

The base URL of the analytics-service Azure Function.

**Development:**
```
VITE_ANALYTICS_SERVICE_URL=https://analytics-service-func-dev.azurewebsites.net
```

**Staging:**
```
VITE_ANALYTICS_SERVICE_URL=https://analytics-service-func-staging.azurewebsites.net
```

**Production:**
```
VITE_ANALYTICS_SERVICE_URL=https://analytics-service-func-prod.azurewebsites.net
```

### 2. VITE_ANALYTICS_WRITE_KEY

The authentication key for the analytics service. This should be retrieved from Azure Key Vault.

**⚠️ IMPORTANT: Never commit the write key to source control!**

## GitHub Actions Configuration

Analytics is automatically configured during deployment if you set up the required GitHub secret:

1. **Add `AZURE_KEYVAULT_NAME` secret** to your GitHub repository environment (dev/staging/prod)
2. **Ensure Key Vault contains** a secret named `analytics-write-key`
3. **Grant service principal** "Key Vault Secrets User" role on the Key Vault

The deployment workflow will:
- Authenticate to Azure using OIDC
- Retrieve the write key from Key Vault
- Pass it securely to the Container App as a secret
- Set it as an environment variable at runtime

**If `AZURE_KEYVAULT_NAME` is not configured:**
- Deployment will succeed with a warning
- Analytics will be deployed without authentication
- Events will be sent but may be rejected by the analytics service

## Local Development

For local development, retrieve the write key from Key Vault:

```bash
# Get the write key
az keyvault secret show \
  --name analytics-write-key \
  --vault-name <your-keyvault-name> \
  --query value -o tsv

# Add to .env.development (DO NOT COMMIT THIS FILE)
echo "VITE_ANALYTICS_WRITE_KEY=<key-from-above>" >> .env.development
```

## Verification

After deployment, verify analytics is working:

1. Open the deployed app in a browser
2. Open DevTools Network tab
3. Filter for "events" or "/api/v1/events"
4. You should see POST requests with 202 Accepted responses

## Troubleshooting

### 401 Unauthorized
- The write key is missing or incorrect
- Verify the key in Key Vault matches what's configured

### 405 Method Not Allowed
- The service URL is incorrect
- Verify the Azure Function endpoint is correct

### Network errors
- Check if the analytics-service Function App is running
- Verify CORS is configured on the Function App
