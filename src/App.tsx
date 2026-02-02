/**
 * App Component - Shell Routing
 *
 * Implements deterministic top-level routing for the micro-frontend shell.
 *
 * Route Ownership:
 * - /campaigns/* → Campaigns remote app
 * - /secondary/* → Secondary remote app
 * - /* → Core remote app (default/catch-all)
 *
 * Route Matching Order (deterministic):
 * 1. /campaigns/* - Exact prefix match for campaigns routes
 * 2. /secondary/* - Exact prefix match for secondary routes
 * 3. / - Index route (home page)
 * 4. /* - Catch-all for all other routes (handled by core app)
 *
 * Design Principles:
 * - Shell only knows top-level route prefixes, not internal remote routes
 * - Remote apps handle their own internal routing
 * - Shell provides fallback for failed remote loads (via RemoteAppErrorBoundary)
 */

import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import RemoteAppMount from '@/components/RemoteAppMount';
import RemoteAppLoader from '@/components/RemoteAppLoader';
import { coreAppStub, campaignsAppStub, secondaryAppStub } from '@/stubs';
import { getRemoteUrl } from '@/config/remotes';
import { useShellPageViews } from '@/analytics';

/**
 * Route configuration for remote apps
 * This makes the routing rules explicit and testable
 */
const REMOTE_ROUTES = {
  campaigns: {
    path: 'campaigns/*',
    basePath: '/campaigns',
    remoteApp: campaignsAppStub,
    name: 'campaigns',
  },
  secondary: {
    path: 'secondary/*',
    basePath: '/secondary',
    remoteUrl: getRemoteUrl('secondary'),
    remoteName: 'secondary',
    fallbackStub: secondaryAppStub,
    name: 'secondary',
  },
  core: {
    basePath: '/',
    remoteUrl: getRemoteUrl('core'),
    remoteName: 'core',
    fallbackStub: coreAppStub,
    name: 'core',
  },
} as const;

function App() {
  // Auto-track page views and session starts
  useShellPageViews();

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Campaigns app - matches /campaigns and all sub-routes */}
        <Route
          path={REMOTE_ROUTES.campaigns.path}
          element={
            <RemoteAppMount
              remoteApp={REMOTE_ROUTES.campaigns.remoteApp}
              basePath={REMOTE_ROUTES.campaigns.basePath}
              name={REMOTE_ROUTES.campaigns.name}
            />
          }
        />

        {/* Secondary app - matches /secondary and all sub-routes */}
        <Route
          path={REMOTE_ROUTES.secondary.path}
          element={
            <RemoteAppLoader
              name={REMOTE_ROUTES.secondary.name}
              remoteUrl={REMOTE_ROUTES.secondary.remoteUrl}
              remoteName={REMOTE_ROUTES.secondary.remoteName}
              basePath={REMOTE_ROUTES.secondary.basePath}
              fallbackStub={REMOTE_ROUTES.secondary.fallbackStub}
            />
          }
        />

        {/* Core app - index route (/) */}
        <Route
          index
          element={
            <RemoteAppLoader
              name={REMOTE_ROUTES.core.name}
              remoteUrl={REMOTE_ROUTES.core.remoteUrl}
              remoteName={REMOTE_ROUTES.core.remoteName}
              basePath={REMOTE_ROUTES.core.basePath}
              fallbackStub={REMOTE_ROUTES.core.fallbackStub}
            />
          }
        />

        {/* Core app - catch-all for all other routes */}
        <Route
          path="*"
          element={
            <RemoteAppLoader
              name={REMOTE_ROUTES.core.name}
              remoteUrl={REMOTE_ROUTES.core.remoteUrl}
              remoteName={REMOTE_ROUTES.core.remoteName}
              basePath={REMOTE_ROUTES.core.basePath}
              fallbackStub={REMOTE_ROUTES.core.fallbackStub}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
export { REMOTE_ROUTES };
