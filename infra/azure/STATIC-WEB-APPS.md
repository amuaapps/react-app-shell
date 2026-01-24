# Azure Static Web Apps Deployment

This directory contains infrastructure-as-code for deploying the React App Shell to Azure Static Web Apps.

## Architecture

**Azure Static Web Apps** provides:
- Global CDN distribution
- Automatic SSL certificates
- Built-in staging environments for pull requests
- GitHub Actions integration
- Custom domains support
- Free tier available

## Prerequisites

### 1. Azure Resources

Create a resource group (if not exists):
```bash
az group create \
  --name react-app-shell-dev-rg \
  --location northeurope
```

### 2. GitHub Secrets

**Repository-level secrets:**
- `NPM_PACKAGE_TOKEN`: Token for accessing private npm packages
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Deployment token from Static Web App (see setup below)

**Note:** Static Web Apps uses a simpler authentication model than Container Apps - just a deployment token, no OIDC setup required.

## Setup

### Option 1: Deploy via Bicep (Recommended)

1. **Create Static Web App via Bicep:**
   ```bash
   az deployment group create \
     --resource-group react-app-shell-dev-rg \
     --template-file infra/azure/main-static.bicep \
     --parameters \
       staticWebAppName=react-app-shell-dev \
       location=northeurope \
       repositoryUrl=https://github.com/amuaapps/react-app-shell \
       branch=develop \
       repositoryToken=$GITHUB_TOKEN \
       environment=dev
   ```

2. **Get the deployment token:**
   ```bash
   az staticwebapp secrets list \
     --name react-app-shell-dev \
     --resource-group react-app-shell-dev-rg \
     --query "properties.apiKey" \
     --output tsv
   ```

3. **Add to GitHub Secrets:**
   - Go to Settings → Secrets and variables → Actions → Repository secrets
   - Add `AZURE_STATIC_WEB_APPS_API_TOKEN` with the token from step 2

### Option 2: Create via Azure Portal

1. Go to Azure Portal → Create a resource → Static Web App
2. Configure:
   - **Name:** `react-app-shell-dev`
   - **Region:** North Europe
   - **Plan type:** Free
   - **Source:** GitHub
   - **Repository:** amuaapps/react-app-shell
   - **Branch:** develop
   - **Build Details:**
     - Build Presets: Custom
     - App location: `/`
     - Api location: (leave empty)
     - Output location: `dist`
3. After creation, copy the deployment token from the Static Web App overview
4. Add to GitHub Secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN`

## Deployment

### Automatic Deployment

The workflow automatically deploys on push:
- **Push to develop** → Deploys to dev Static Web App
- **Push to staging** → Deploys to staging Static Web App
- **Push to main** → Deploys to prod Static Web App
- **Pull requests** → Creates temporary staging environment

### Manual Deployment

1. Go to **Actions** → **Deploy to Azure Static Web Apps**
2. Click **Run workflow**
3. Select environment (dev/staging/prod)

## Staging Environments

Static Web Apps automatically creates staging environments for pull requests:
- Each PR gets a unique URL: `https://<app-name>-<pr-number>.azurestaticapps.net`
- Staging environments are automatically cleaned up when PR is closed
- Perfect for testing before merging

## Custom Domains

To add a custom domain:

```bash
az staticwebapp hostname set \
  --name react-app-shell-dev \
  --resource-group react-app-shell-dev-rg \
  --hostname app.example.com
```

Then add a CNAME record in your DNS:
```
CNAME app.example.com -> <static-web-app-url>
```

## Monitoring

View deployment logs:
```bash
az staticwebapp show \
  --name react-app-shell-dev \
  --resource-group react-app-shell-dev-rg
```

View deployment history in Azure Portal:
- Go to Static Web App → Deployments

## Troubleshooting

### Deployment fails with authentication error
- Verify `AZURE_STATIC_WEB_APPS_API_TOKEN` is correctly set in GitHub Secrets
- Token can be regenerated in Azure Portal if needed

### Build fails
- Check GitHub Actions logs for build errors
- Verify `npm run build` works locally
- Ensure all dependencies are in package.json

### App doesn't load after deployment
- Check browser console for errors
- Verify output location is set to `dist` in workflow
- Ensure SPA routing is configured (Static Web Apps handles this automatically)

## Cost

**Free tier includes:**
- 100 GB bandwidth per month
- 0.5 GB storage
- Custom domains
- SSL certificates
- Staging environments

**Standard tier** ($9/month):
- 100 GB bandwidth (additional $0.20/GB)
- 0.5 GB storage (additional $0.50/GB)
- SLA
- Custom authentication

## Differences from Container Apps

**Advantages:**
- Simpler setup (no Docker, no OIDC)
- Built-in staging environments for PRs
- Free tier is very generous
- Automatic CDN distribution

**Limitations:**
- No blue/green deployment control (deploys are immediate)
- No custom server-side logic (static files only)
- No environment variables at runtime (build-time only)
- No manual traffic splitting

## Migration Notes

If migrating from Container Apps approach:
1. Static Web Apps doesn't support blue/green traffic splitting
2. Deployments are immediate (no 0% traffic testing)
3. Use PR staging environments for testing instead
4. No Docker/Nginx configuration needed
5. Simpler secrets management (just deployment token)
