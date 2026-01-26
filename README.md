# React App Shell

A modern React application shell following MACH principles and Amua Apps coding standards. This is the **host application** for a micro-frontend architecture that dynamically loads and mounts remote React applications.

## Purpose & Repository Relationships

### What This Repository Does

The `react-app-shell` is the **chrome and routing host**. It is responsible for:

- **Application Chrome**: Renders `TopNavigation` and `Footer` from `@amuaapps/ui-library`
- **Theming**: Applies design tokens and styling from `@amuaapps/ui-theme-core`
- **Top-Level Routing**: Owns the main React Router configuration and route-to-remote mapping
- **Remote App Mounting**: Dynamically loads and mounts remote React applications based on route patterns

### Repository Relationships

This shell orchestrates multiple remote applications in a micro-frontend architecture:

| Repository | Responsibility | Routes Owned | Status |
|------------|---------------|--------------|--------|
| **`react-app-shell`** (this repo) | Chrome, routing, remote mounting | None (delegates all routes) | ✅ Active |
| **`react-app-core`** | Core application features and most routes | `/**` (catch-all) | 🔮 Future |
| **`react-app-campaigns`** | Campaign management features | `/campaigns/*` | 🔮 Future |

**Key Principle**: The shell owns **no business logic or feature routes**. It only provides the chrome (navigation, footer) and delegates all routes to remote applications.

### Remote Mount Contract v1

Remote applications must export a specific contract to be mounted by the shell. Each remote must provide:

```typescript
// Remote app entry point (e.g., remoteEntry.js)
interface RemoteApp {
  /**
   * Mount the remote app into a DOM container
   * @param container - DOM element to mount into
   * @param options - Mount options including routing context
   * @returns Promise with success status and optional error
   */
  mount(
    container: HTMLElement,
    options: {
      basePath: string;           // Route prefix for this remote (e.g., "/campaigns")
      initialPath: string;         // Current browser path
      onNavigate: (path: string) => void;  // Callback to notify shell of navigation
      contractVersion: '1';        // Contract version for compatibility
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Unmount the remote app and clean up resources
   */
  unmount?(): void;
}
```

**Example Remote Implementation:**

```typescript
// In react-app-campaigns/src/remoteEntry.ts
export const mount = async (container, options) => {
  const { basePath, initialPath, onNavigate, contractVersion } = options;
  
  if (contractVersion !== '1') {
    return { success: false, error: 'Unsupported contract version' };
  }
  
  // Mount your React app
  const root = ReactDOM.createRoot(container);
  root.render(
    <BrowserRouter basename={basePath}>
      <App onNavigate={onNavigate} initialPath={initialPath} />
    </BrowserRouter>
  );
  
  return { success: true };
};

export const unmount = () => {
  // Cleanup logic
};
```

**Contract Guarantees:**

- Shell will call `mount()` when the route matches the remote's pattern
- Shell will call `unmount()` when navigating away from the remote's routes
- Shell provides navigation sync via `onNavigate` callback
- Remote must handle its own routing within its `basePath`

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0 (pinned via `.nvmrc`)
- **npm** >= 9.0.0
- **GitHub Personal Access Token (PAT)** with `read:packages` scope for private packages

### GitHub Packages Authentication

This project consumes private packages from GitHub Packages:
- `@amuaapps/ui-library`
- `@amuaapps/ui-theme-core`

#### Local Development Setup

1. **Create a GitHub Personal Access Token (PAT)**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with `read:packages` scope
   - Copy the token (you won't be able to see it again)

2. **Configure npm authentication**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   export NPM_PACKAGE_TOKEN=your_github_token_here
   npm install
   ```

   **Option B: Local .npmrc file**
   ```bash
   echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE" > .npmrc.local
   npm install
   ```
   Note: `.npmrc.local` is gitignored and will never be committed.

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (Vite default)

### Running Locally with Stub Remotes

Since remote applications (`react-app-core`, `react-app-campaigns`) are not yet implemented, the shell currently runs with **stub remotes** for local development.

**Current Behavior:**

- The shell loads successfully with chrome (TopNavigation, Footer)
- Routes are configured but remotes are not yet available
- You'll see placeholder content or error boundaries where remotes would mount

**To Run with Real Remotes (Future):**

1. **Start remote apps locally:**
   ```bash
   # In react-app-core directory
   npm run dev  # Runs on http://localhost:3001
   
   # In react-app-campaigns directory
   npm run dev  # Runs on http://localhost:3002
   ```

2. **Configure remote entry URLs** (see Configuration section below)

3. **Start the shell:**
   ```bash
   npm run dev
   ```

The shell will dynamically load remotes from the configured URLs.

### Configuring Remote Entry URLs

Remote applications are loaded via **remote entry URLs** configured in `src/config/remotes.ts`:

```typescript
export const remoteConfig = {
  core: {
    url: process.env.VITE_REMOTE_CORE_URL || 'http://localhost:3001/remoteEntry.js',
    scope: 'reactAppCore',
    module: './App',
  },
  campaigns: {
    url: process.env.VITE_REMOTE_CAMPAIGNS_URL || 'http://localhost:3002/remoteEntry.js',
    scope: 'reactAppCampaigns',
    module: './App',
  },
};
```

**Environment Variables:**

- **Local Development**: Use `.env.local` (gitignored)
  ```bash
  VITE_REMOTE_CORE_URL=http://localhost:3001/remoteEntry.js
  VITE_REMOTE_CAMPAIGNS_URL=http://localhost:3002/remoteEntry.js
  ```

- **Production**: Set via Azure App Settings or environment configuration
  ```bash
  VITE_REMOTE_CORE_URL=https://core.example.com/remoteEntry.js
  VITE_REMOTE_CAMPAIGNS_URL=https://campaigns.example.com/remoteEntry.js
  ```

#### CI/CD Authentication

In GitHub Actions, authentication is handled automatically using the `NPM_PACKAGE_TOKEN` repository secret:

```yaml
- name: Install dependencies
  run: npm ci
  env:
    NPM_PACKAGE_TOKEN: ${{ secrets.NPM_PACKAGE_TOKEN }}
```

**Setting up the repository secret:**
1. Go to repository Settings → Secrets and variables → Actions
2. Create a new repository secret named `NPM_PACKAGE_TOKEN`
3. Use a GitHub PAT with `read:packages` scope as the value

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code (CI-blocking)
- `npm run lint:fix` - Fix linting issues
- `npm run typecheck` - Type check (CI-blocking)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting (CI-blocking)
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Troubleshooting

#### Authentication Issues

**Problem: `npm install` fails with 401 Unauthorized**

Solution:
1. Verify your GitHub token has `read:packages` scope
2. Ensure the token is properly set:
   ```bash
   echo $NPM_PACKAGE_TOKEN  # Should output your token
   ```
3. If using `.npmrc.local`, verify the file exists and contains your token
4. Try clearing npm cache: `npm cache clean --force`

**Problem: Cannot find package `@amuaapps/ui-library`**

Solution:
1. Verify the package exists in GitHub Packages
2. Check that `.npmrc` contains the correct registry configuration
3. Ensure you have access to the `amuaapps` organization packages

**Problem: CI/CD pipeline fails with authentication error**

Solution:
1. Verify `NPM_PACKAGE_TOKEN` secret is set in repository settings
2. Ensure the token used in the secret has `read:packages` scope
3. Check that the workflow file passes the secret as an environment variable

## Azure Deployment

### Prerequisites

Before deploying to Azure Container Apps, you need:

1. **Azure Resources:**
   - Azure subscription with `Microsoft.App` resource provider registered
   - Resource group created
   - Container Apps Environment created
   - Azure AD App Registration for OIDC authentication

2. **GitHub Secrets** (Environment-specific):
   
   Navigate to: **Repository Settings → Environments → [dev/staging/prod] → Secrets**
   
   | Secret Name | Description | Example |
   |-------------|-------------|---------|
   | `AZURE_CLIENT_ID` | Azure AD App Registration client ID | `12345678-1234-1234-1234-123456789abc` |
   | `AZURE_TENANT_ID` | Azure AD tenant ID | `87654321-4321-4321-4321-cba987654321` |
   | `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | `abcdef12-3456-7890-abcd-ef1234567890` |
   | `AZURE_RESOURCE_GROUP_NAME` | Resource group name | `rg-react-app-shell-dev` |
   | `AZURE_CONTAINER_APPS_ENVIRONMENT_NAME` | Container Apps Environment name | `cae-react-app-shell-dev` |
   | `AZURE_CONTAINER_APP_NAME` | Container App name | `ca-react-app-shell-dev` |
   | `NPM_PACKAGE_TOKEN` | GitHub PAT with `read:packages` and `write:packages` | `ghp_xxxxxxxxxxxx` |

3. **GitHub Variables** (Repository-level):
   
   Navigate to: **Repository Settings → Secrets and variables → Actions → Variables**
   
   | Variable Name | Description | Example |
   |---------------|-------------|---------|
   | `AZURE_REGION` | Azure region for deployment | `northeurope` |

### First-Time Deployment Setup

**Important**: The workflow is configured with `isFirstDeployment=false` for blue/green deployments. If this is your **very first deployment** to a new Container App:

1. Temporarily change `isFirstDeployment=false` to `isFirstDeployment=true` in `.github/workflows/deploy.yml`
2. Push to `develop` branch to trigger deployment
3. After successful first deployment, change back to `isFirstDeployment=false`
4. Commit and push the change

**Why?** The first deployment needs 100% traffic to the initial revision. Subsequent deployments use blue/green strategy with 0% traffic for testing, then switch to 100% after verification.

### Deployment Flow

**Automated Deployment** (on push to `develop`, `staging`, or `main`):

1. **Test** - Run linting, type checking, and tests
2. **Build** - Build and push Docker image to GitHub Container Registry
3. **Deploy** - Deploy to Azure Container Apps with 0% traffic (blue/green)
4. **Verify** - Health check and smoke tests on new revision
5. **Traffic Switch** - Switch 100% traffic to new revision (main branch only)

**Manual Deployment** (workflow dispatch):

1. Go to **Actions → Deploy to Azure**
2. Click **Run workflow**
3. Select branch and environment
4. Optionally enable traffic switch

### Monitoring Deployment

- **GitHub Actions**: Check workflow run logs for detailed deployment progress
- **Azure Portal**: Monitor Container App revisions and traffic distribution
- **Application URL**: Access via Container App FQDN (shown in deployment summary)

### Troubleshooting Deployment

**Problem: `Microsoft.App` provider not registered**

Solution:
```bash
az provider register --namespace Microsoft.App
az provider show --namespace Microsoft.App --query "registrationState"
```

**Problem: Traffic weight validation error**

Solution: Ensure `isFirstDeployment` is set correctly (see First-Time Deployment Setup above)

**Problem: Container fails to pull image from GHCR**

Solution:
1. Verify `NPM_PACKAGE_TOKEN` has `read:packages` scope
2. Check that the token is not expired
3. Ensure Container App has correct registry credentials

## Documentation

### Required UI & Brand Contracts

This repository follows strict UI and brand contracts. Before making any UI changes, consult:

- **[Brand Contract](./docs/brand-contract.md)** — Brand identity, theming, and token-first branding rules
- **[UI Contract](./docs/ui-contract.md)** — Component composition, spacing, accessibility, and styling rules
- **[Design Tokens](./docs/design-tokens.md)** — Token architecture, semantic tokens, and compliance rules

### Standards

- **[Coding Standards](./docs/agents.md)** — Complete coding standards and OSS setup for Amua Apps

See the [docs](./docs) directory for all documentation.

## Future Work

This section outlines planned enhancements and extension points for the shell and remote applications.

### 1. Analytics Integration

**Goal**: Centralized analytics tracking across all remote applications.

**Planned Approach**:
- Shell provides analytics context via React Context API
- Remote apps consume analytics context and track events
- Support for multiple analytics providers (Google Analytics, Mixpanel, etc.)
- Event standardization across remotes

**Implementation**:
```typescript
// Shell provides analytics context
<AnalyticsProvider config={analyticsConfig}>
  <RemoteAppMount remoteApp={coreApp} />
</AnalyticsProvider>

// Remotes consume analytics
const { trackEvent } = useAnalytics();
trackEvent('campaign_created', { campaignId: '123' });
```

**Extension Points**:
- `src/contexts/AnalyticsContext.tsx` - Analytics provider
- `src/lib/analytics/` - Analytics adapters for different providers
- Remote mount contract v2 - Include analytics context in mount options

### 2. Authentication & Authorization State

**Goal**: Shared authentication state and user context across all remotes.

**Planned Approach**:
- Shell owns authentication state (login, logout, token refresh)
- User context provided to all remotes via React Context
- Role-based access control (RBAC) for routes and features
- SSO integration (Azure AD, Auth0, etc.)

**Implementation**:
```typescript
// Shell provides auth context
<AuthProvider>
  <ProtectedRoute requiredRole="admin">
    <RemoteAppMount remoteApp={campaignsApp} />
  </ProtectedRoute>
</AuthProvider>

// Remotes consume auth context
const { user, isAuthenticated, hasRole } = useAuth();
if (hasRole('campaign_manager')) {
  // Show campaign management features
}
```

**Extension Points**:
- `src/contexts/AuthContext.tsx` - Authentication provider
- `src/components/ProtectedRoute.tsx` - Route-level auth guards
- `src/lib/auth/` - Auth adapters for different providers
- Remote mount contract v2 - Include user context in mount options

### 3. Adding More Route Groups / Remotes

**Goal**: Easy addition of new remote applications for new feature domains.

**Process for Adding a New Remote**:

1. **Create Remote Repository**:
   ```bash
   # Example: react-app-analytics
   npx create-react-app react-app-analytics --template typescript
   ```

2. **Implement Remote Contract**:
   ```typescript
   // src/remoteEntry.ts
   export const mount = async (container, options) => {
     // Mount logic following contract v1
   };
   export const unmount = () => {
     // Cleanup logic
   };
   ```

3. **Configure Remote in Shell**:
   ```typescript
   // src/config/remotes.ts
   export const remoteConfig = {
     // ... existing remotes
     analytics: {
       url: process.env.VITE_REMOTE_ANALYTICS_URL || 'http://localhost:3003/remoteEntry.js',
       scope: 'reactAppAnalytics',
       module: './App',
     },
   };
   ```

4. **Add Route Mapping**:
   ```typescript
   // src/App.tsx
   <Route path="/analytics/*" element={
     <RemoteAppMount 
       remoteApp={analyticsApp} 
       basePath="/analytics"
       name="analytics"
     />
   } />
   ```

5. **Deploy Remote Independently**:
   - Each remote has its own CI/CD pipeline
   - Deployed to separate Azure Container Apps or Static Web Apps
   - Shell loads remote via configured entry URL

**Extension Points**:
- `src/config/remotes.ts` - Remote configuration
- `src/App.tsx` - Route definitions
- `src/components/RemoteAppMount.tsx` - Remote mounting logic
- `src/lib/remoteLoader.ts` - Dynamic remote loading

### 4. Error Boundaries & Fallbacks

**Goal**: Graceful degradation when remotes fail to load or crash.

**Planned Enhancements**:
- Per-remote error boundaries with custom fallback UI
- Retry mechanisms for failed remote loads
- Telemetry for remote loading failures
- Fallback routes when remotes are unavailable

### 5. Shared State Management

**Goal**: Optional shared state between shell and remotes.

**Planned Approach**:
- Redux or Zustand store provided by shell
- Remotes can opt-in to shared state
- Clear boundaries between local and shared state
- State synchronization across remotes

### 6. Performance Optimization

**Goal**: Optimize remote loading and runtime performance.

**Planned Enhancements**:
- Lazy loading of remotes (load on route access, not app start)
- Preloading of likely-next remotes
- Code splitting within remotes
- Shared dependencies to reduce bundle duplication
- Performance monitoring and metrics

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines and development workflow.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
