# Core App Integration Guide

This document explains how the shell integrates with the real **react-app-core** remote app from Azure.

## Overview

The shell now dynamically loads the core app from Azure Container Apps instead of using a local stub. The integration uses Module Federation with automatic fallback to stubs if the remote app is unavailable.

## Environment Configuration

The core app URL is configured per environment:

| Environment | URL |
|-------------|-----|
| **Development** | `https://ca-react-app-core-dev.westeurope.azurecontainerapps.io/assets/remoteEntry.js` |
| **Staging** | `https://ca-react-app-core-staging.westeurope.azurecontainerapps.io/assets/remoteEntry.js` |
| **Production** | `https://ca-react-app-core-prod.westeurope.azurecontainerapps.io/assets/remoteEntry.js` |

**Note:** Update the region (`westeurope`) in `.env.*` files to match your actual Azure region.

## Module Federation Details

- **Remote Name:** `remoteApp_core`
- **Exposed Module:** `./bootstrap`
- **Contract Version:** `1` (fully compliant with RemoteAppContract)
- **Shared Dependencies:** React 18.2.0 (singleton), React DOM 18.2.0 (singleton)

## How It Works

1. **RemoteAppLoader Component** (`src/components/RemoteAppLoader.tsx`):
   - Attempts to load the remote app from the configured URL
   - Shows loading spinner while fetching
   - Falls back to local stub if loading fails
   - Displays warning banner when using fallback

2. **Dynamic Loading** (`src/lib/remote-app-contract/loader.ts`):
   - Loads remote entry script
   - Validates contract version
   - Implements retry logic (2 retries, 10s timeout)
   - Reports errors via error reporter

3. **Graceful Degradation**:
   - If Azure is unavailable → uses local stub
   - If remote app fails validation → uses local stub
   - If network timeout → uses local stub

## Manual Testing

### Test Real Core App Loading

```bash
# Start the dev server
npm run dev

# Open browser to http://localhost:3001
# You should see:
# - Loading spinner briefly
# - Real core app content from Azure
# - No warning banner (means real app loaded successfully)
```

### Test Fallback to Stub

```bash
# Temporarily break the URL in .env.development
# Change to: VITE_CORE_REMOTE_ENTRY_URL=https://invalid-url.example.com/remoteEntry.js

# Start dev server
npm run dev

# Open browser to http://localhost:3001
# You should see:
# - Loading spinner briefly
# - Yellow warning banner: "Development Mode: Using local stub..."
# - Local stub content (placeholder UI)
```

### Verify Environment-Specific URLs

```bash
# Build for staging
npm run build -- --mode staging

# Build for production  
npm run build -- --mode production

# Check that correct URLs are used in each build
```

## Browser Console Checks

Open browser DevTools console and verify:

1. **Successful Load:**
   ```
   No errors
   Network tab shows: GET .../remoteEntry.js → 200 OK
   ```

2. **Fallback to Stub:**
   ```
   Error: Failed to load remote app "core"
   Network tab shows: GET .../remoteEntry.js → Failed
   ```

## Troubleshooting

### Core app not loading

**Symptoms:** Warning banner appears, stub content shown

**Possible causes:**
1. Azure Container App is not running
2. Wrong URL in `.env.development`
3. Network/firewall blocking request
4. CORS issues (check browser console)

**Solutions:**
1. Verify core app is deployed: `az containerapp show --name ca-react-app-core-dev --resource-group <rg>`
2. Check URL matches actual FQDN
3. Test URL directly in browser: `https://ca-react-app-core-dev.westeurope.azurecontainerapps.io/assets/remoteEntry.js`
4. Check Azure Container App ingress settings

### Module Federation errors

**Symptoms:** `window.remoteApp_core is not defined`

**Possible causes:**
1. Core app not exposing correct module name
2. Core app build failed
3. Wrong remote entry URL

**Solutions:**
1. Verify core app webpack/vite config exposes `remoteApp_core`
2. Check core app build logs
3. Test remoteEntry.js loads and defines global variable

### Contract version mismatch

**Symptoms:** Error: `Remote app uses contract version X, but shell expects version 1`

**Solution:** Update core app to implement contract v1 or update shell contract version

## Next Steps

1. **Fix Routing Tests:** Update tests in `tests/unit/routing/shell-routing.test.tsx` to handle async RemoteAppLoader
2. **Add Loader Tests:** Create `tests/unit/components/RemoteAppLoader.test.tsx`
3. **Integrate Campaigns App:** Apply same pattern to campaigns app when ready
4. **Monitor Production:** Add observability for remote app loading failures

## Related Files

- `src/components/RemoteAppLoader.tsx` - Dynamic loader component
- `src/App.tsx` - Routing configuration
- `src/config/remotes.ts` - Environment-based URL configuration
- `src/lib/remote-app-contract/loader.ts` - Low-level loading logic
- `.env.development` - Dev environment URLs
- `.env.staging` - Staging environment URLs
- `.env.production` - Production environment URLs
