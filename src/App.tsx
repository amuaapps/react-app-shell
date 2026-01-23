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
import { coreAppStub, campaignsAppStub } from '@/stubs';

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
    remoteApp: coreAppStub,
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
            <RemoteAppMount
              remoteApp={REMOTE_ROUTES.core.remoteApp}
              basePath={REMOTE_ROUTES.core.basePath}
              name={REMOTE_ROUTES.core.name}
            />
          }
        />

        {/* Core app - catch-all for all other routes */}
        <Route
          path="*"
          element={
            <RemoteAppMount
              remoteApp={REMOTE_ROUTES.core.remoteApp}
              basePath={REMOTE_ROUTES.core.basePath}
              name={REMOTE_ROUTES.core.name}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
export { REMOTE_ROUTES };
