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

## Module Federation Configuration

### Shell Configuration (Already Implemented)

The shell loads the core app by:
1. Loading `remoteEntry.js` from the configured URL
2. Dynamically importing `remoteApp_core/bootstrap`
3. Expecting `window.remoteApp_core` to be exposed

### Core App Requirements

**The core app MUST expose the `bootstrap` module in its Module Federation config.**

#### Vite Module Federation Config (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'remoteApp_core',
      filename: 'remoteEntry.js',
      exposes: {
        './bootstrap': './src/bootstrap.tsx', // REQUIRED
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.2.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.2.0',
        },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
```

#### Bootstrap Module (src/bootstrap.tsx)

**IMPORTANT:** The bootstrap module must expose `window.remoteApp_core` immediately when loaded.

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

let root: ReactDOM.Root | null = null;

// Expose the remote app on window immediately
window.remoteApp_core = {
  mount: (container: HTMLElement, config: { basePath: string }) => {
    root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <BrowserRouter basename={config.basePath}>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    return Promise.resolve({ success: true });
  },
  unmount: () => {
    if (root) {
      root.unmount();
      root = null;
    }
  },
  contractVersion: '1',
};

// Export empty object to satisfy module requirements
export {};
```

#### Main Entry Point (src/main.tsx)

The main entry should import bootstrap to ensure it executes:

```typescript
import './bootstrap';

// Optionally, if running standalone:
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
//
// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
```

#### Type Declarations (src/vite-env.d.ts)

```typescript
interface RemoteAppInstance {
  mount: (container: HTMLElement, config: { basePath: string }) => void;
  unmount: () => void;
  version: string;
}

declare global {
  interface Window {
    remoteApp_core: RemoteAppInstance;
  }
}

export {};
```

### Summary

- **Exposed Module:** `./bootstrap` → `src/bootstrap.tsx`
- **Global Variable:** `window.remoteApp_core`
- **Contract Version:** `1`
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

**Symptoms:** `Module Federation container 'remoteApp_core' not found on window`

**Possible causes:**
1. Core app's `bootstrap.tsx` not exposing `window.remoteApp_core`
2. Bootstrap module not being imported/executed
3. Core app build configuration issue

**Solutions:**
1. **Verify bootstrap.tsx sets `window.remoteApp_core`** immediately (not in a function)
2. **Ensure main.tsx imports bootstrap:** `import './bootstrap';`
3. **Check the built remoteEntry.js** loads and executes bootstrap
4. **Test in browser console:** After remoteEntry.js loads, check if `window.remoteApp_core` exists
5. **Verify Module Federation config** exposes `./bootstrap` correctly

**Debug steps:**
```javascript
// In browser console after remoteEntry.js loads:
console.log(window.remoteApp_core); // Should be an object with mount, unmount, contractVersion
console.log(Object.keys(window).filter(k => k.startsWith('remoteApp'))); // Should show ['remoteApp_core']
```

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
