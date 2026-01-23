# Remote Application Configuration

This document describes how to configure remote micro-frontend URLs for different environments.

## Overview

The React App Shell uses environment-driven configuration to determine the URLs of remote micro-frontend applications. This allows you to:

- Change remote URLs without modifying source code
- Configure different URLs per environment (dev, staging, production)
- Use safe defaults for local development
- Deploy the same codebase to multiple environments

## Configuration Strategy

We use **build-time injection** via Vite environment variables. This approach:

- ✅ Is simple and well-supported by Vite
- ✅ Requires no runtime configuration endpoint
- ✅ Works seamlessly with CI/CD pipelines
- ✅ Provides type-safe configuration in code
- ⚠️ Requires rebuild to change URLs (acceptable for our deployment model)

## Environment Variables

The shell recognizes the following environment variables:

| Variable | Description | Default (Local Dev) |
|----------|-------------|---------------------|
| `VITE_CORE_REMOTE_ENTRY_URL` | URL for the core remote app entry point | `http://localhost:3002/remoteEntry.js` |
| `VITE_CAMPAIGNS_REMOTE_ENTRY_URL` | URL for the campaigns remote app entry point | `http://localhost:3003/remoteEntry.js` |

**Important:** All environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## Local Development

For local development, the shell uses safe defaults that assume remote apps are running on standard ports:

- **Core app:** `http://localhost:3002/remoteEntry.js`
- **Campaigns app:** `http://localhost:3003/remoteEntry.js`

You can override these by creating a `.env.development` file (already provided):

```bash
# .env.development
VITE_CORE_REMOTE_ENTRY_URL=http://localhost:3002/remoteEntry.js
VITE_CAMPAIGNS_REMOTE_ENTRY_URL=http://localhost:3003/remoteEntry.js
```

## Staging Environment

Create a `.env.staging` file or set environment variables in your CI/CD pipeline:

```bash
# .env.staging
VITE_CORE_REMOTE_ENTRY_URL=https://staging-core.amuaapps.com/remoteEntry.js
VITE_CAMPAIGNS_REMOTE_ENTRY_URL=https://staging-campaigns.amuaapps.com/remoteEntry.js
```

Build command:
```bash
npm run build -- --mode staging
```

## Production Environment

Create a `.env.production` file or set environment variables in your CI/CD pipeline:

```bash
# .env.production
VITE_CORE_REMOTE_ENTRY_URL=https://core.amuaapps.com/remoteEntry.js
VITE_CAMPAIGNS_REMOTE_ENTRY_URL=https://campaigns.amuaapps.com/remoteEntry.js
```

Build command:
```bash
npm run build -- --mode production
```

## CI/CD Configuration

### GitHub Actions Example

```yaml
- name: Build for staging
  env:
    VITE_CORE_REMOTE_ENTRY_URL: ${{ secrets.STAGING_CORE_URL }}
    VITE_CAMPAIGNS_REMOTE_ENTRY_URL: ${{ secrets.STAGING_CAMPAIGNS_URL }}
  run: npm run build
```

### Azure Pipelines Example

```yaml
- task: Npm@1
  inputs:
    command: 'custom'
    customCommand: 'run build'
  env:
    VITE_CORE_REMOTE_ENTRY_URL: $(STAGING_CORE_URL)
    VITE_CAMPAIGNS_REMOTE_ENTRY_URL: $(STAGING_CAMPAIGNS_URL)
```

## Usage in Code

Import and use the configuration module:

```typescript
import { getRemoteConfig, getRemoteUrl } from '@/config/remotes';

// Get all remote URLs
const config = getRemoteConfig();
console.log(config.coreRemoteEntryUrl);
console.log(config.campaignsRemoteEntryUrl);

// Get a specific remote URL
const coreUrl = getRemoteUrl('core');
const campaignsUrl = getRemoteUrl('campaigns');
```

## Validation

The configuration module provides a validation function:

```typescript
import { isValidRemoteUrl } from '@/config/remotes';

const url = getRemoteUrl('core');
if (!isValidRemoteUrl(url)) {
  console.error('Invalid remote URL:', url);
}
```

## Adding New Remote Applications

To add a new remote application:

1. Add a new environment variable in `.env.example`:
   ```bash
   VITE_NEW_APP_REMOTE_ENTRY_URL=http://localhost:3004/remoteEntry.js
   ```

2. Update the `RemoteConfig` interface in `src/config/remotes.ts`:
   ```typescript
   export interface RemoteConfig {
     coreRemoteEntryUrl: string;
     campaignsRemoteEntryUrl: string;
     newAppRemoteEntryUrl: string; // Add this
   }
   ```

3. Update `DEFAULT_CONFIG` and `getRemoteConfig()` function

4. Update `getRemoteUrl()` to support the new remote

5. Update this documentation

## Troubleshooting

### Remote app not loading

1. Check that the environment variable is set correctly
2. Verify the URL is accessible from the browser
3. Check browser console for CORS errors
4. Ensure the remote app is built and deployed

### Environment variable not working

1. Ensure the variable is prefixed with `VITE_`
2. Restart the dev server after changing `.env` files
3. Check that the correct `.env` file is being used for your environment
4. Verify the variable is being injected: `console.log(import.meta.env)`

### Different URL in production

1. Verify the correct `.env.production` file exists
2. Check that CI/CD is setting the environment variables correctly
3. Inspect the built files to confirm the URLs are correct

## Security Considerations

- ✅ Remote URLs are public (embedded in client-side code)
- ✅ Use HTTPS in production for all remote URLs
- ✅ Implement proper CORS configuration on remote apps
- ✅ Validate remote app contracts before loading
- ⚠️ Do not include sensitive data in environment variables
- ⚠️ Remote apps should implement their own authentication

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Module Federation Best Practices](https://webpack.js.org/concepts/module-federation/)
- Remote App Contract: `src/lib/remote-app-contract/README.md`
