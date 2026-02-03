# Analytics Deployment Configuration

This document describes how to configure analytics for deployment to Azure Container Apps.

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

## Azure Container Apps Configuration

### Option 1: Reference Key Vault Secret Directly (Recommended)

Configure the Container App to reference the Key Vault secret:

```bash
az containerapp update \
  --name react-app-shell-dev \
  --resource-group <resource-group> \
  --set-env-vars "VITE_ANALYTICS_WRITE_KEY=secretref:<keyvault-secret-name>"
```

### Option 2: Set as Build Argument in GitHub Actions

In your GitHub Actions workflow (`.github/workflows/deploy-dev.yml`):

```yaml
- name: Get Analytics Write Key from Key Vault
  id: get-write-key
  run: |
    WRITE_KEY=$(az keyvault secret show \
      --name analytics-write-key \
      --vault-name <your-keyvault-name> \
      --query value -o tsv)
    echo "::add-mask::$WRITE_KEY"
    echo "ANALYTICS_WRITE_KEY=$WRITE_KEY" >> $GITHUB_OUTPUT

- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    build-args: |
      VITE_ANALYTICS_SERVICE_URL=https://analytics-service-func-dev.azurewebsites.net
      VITE_ANALYTICS_WRITE_KEY=${{ steps.get-write-key.outputs.ANALYTICS_WRITE_KEY }}
```

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
