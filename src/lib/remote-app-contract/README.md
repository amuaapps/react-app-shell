# Remote App Mount Contract v1

This directory defines the contract between the shell and remote micro-frontend apps.

## Overview

The shell uses a **typed contract** to load and mount remote apps without importing their internals. This keeps the shell and remotes loosely coupled while ensuring type safety.

## Contract Version

**Current Version:** `1`

The contract includes a version field to detect compatibility issues. Future breaking changes will increment the version number.

## Remote App Requirements

Remote apps must implement the `RemoteAppInstance` interface:

```typescript
interface RemoteAppInstance {
  contractVersion: string;
  mount(container: HTMLElement, options: RemoteAppMountOptions): Promise<RemoteAppMountResult>;
  unmount?(): Promise<void>;
}
```

### Required: `mount` function

The `mount` function receives:
- **container**: DOM element where the app should render
- **options**: Object containing:
  - `basePath`: Base path the remote owns (e.g., `/campaigns`)
  - `initialPath`: Initial path to render (e.g., `/campaigns/123`)
  - `contractVersion`: Shell's contract version
  - `onNavigate`: Optional callback for navigation requests

Returns a promise with `{ success: boolean, error?: string }`

### Optional: `unmount` function

Clean up resources when the remote is unmounted.

### Required: `contractVersion` field

Must match the shell's contract version (`"1"`).

## Shell Guarantees

The shell treats remotes as **untrusted** and provides:

1. **Timeout/Retry Logic**: Configurable timeout and retry attempts when loading remotes
2. **Error Boundaries**: Remote failures never crash the shell
3. **Clear Error UI**: User-friendly error messages when remotes fail
4. **Version Checking**: Validates contract compatibility before mounting

## Example Remote App

```typescript
// remoteEntry.ts
import { RemoteAppInstance, RemoteAppMountOptions } from '@amuaapps/react-app-shell';

const remoteApp: RemoteAppInstance = {
  contractVersion: '1',
  
  async mount(container: HTMLElement, options: RemoteAppMountOptions) {
    try {
      // Render your app into the container
      ReactDOM.createRoot(container).render(
        <App basePath={options.basePath} initialPath={options.initialPath} />
      );
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
  
  async unmount() {
    // Clean up resources
  }
};

// Expose on window for shell to access
window.remoteApp_campaigns = remoteApp;
```

## Loading Configuration

```typescript
const config: RemoteAppConfig = {
  name: 'campaigns',
  url: 'https://cdn.example.com/campaigns/remoteEntry.js',
  basePath: '/campaigns',
  timeout: 10000,  // 10 seconds
  retries: 2       // 2 retry attempts
};

const instance = await loadRemoteApp(config);
```

## Error Handling

The contract defines specific error types:

- `LOAD_TIMEOUT`: Remote took too long to load
- `LOAD_FAILED`: Script failed to load after retries
- `MOUNT_FAILED`: Mount function failed
- `INCOMPATIBLE_VERSION`: Contract version mismatch
- `INVALID_CONTRACT`: Remote doesn't implement required interface

All errors are wrapped in `RemoteAppError` with context about which remote failed.

## Type Safety

The shell can type-check remote integration without importing remote internals:

```typescript
// Shell code - fully type-safe
const instance: RemoteAppInstance = await loadRemoteApp(config);
const result = await instance.mount(container, {
  basePath: '/campaigns',
  initialPath: '/campaigns/123',
  contractVersion: REMOTE_APP_CONTRACT_VERSION,
  onNavigate: (path) => navigate(path)
});
```

No circular dependencies, no tight coupling.
