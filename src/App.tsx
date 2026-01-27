/**
 * App Component - Shell Routing
 *
 * Implements deterministic top-level routing for the micro-frontend shell.
 *
 * Route Ownership:
 * - /campaigns/* → Campaigns remote app
 * - /* → Core remote app (default/catch-all)
 *
 * Route Matching Order (deterministic):
 * 1. /campaigns/* - Exact prefix match for campaigns routes
 * 2. / - Index route (home page)
 * 3. /* - Catch-all for all other routes (handled by core app)
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
import { coreAppStub, campaignsAppStub } from '@/stubs';
import { getRemoteUrl } from '@/config/remotes';

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
  core: {
    basePath: '/',
    remoteUrl: getRemoteUrl('core'),
    remoteName: 'remoteApp_core',
    fallbackStub: coreAppStub,
    name: 'core',
  },
} as const;

function App() {
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
