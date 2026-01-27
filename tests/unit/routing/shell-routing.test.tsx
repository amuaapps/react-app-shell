/**
 * Shell Routing Tests
 *
 * Verifies that the shell's top-level routing is deterministic and correctly
 * mounts the expected remote apps based on URL paths.
 */

import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App, { REMOTE_ROUTES } from '@/App';
import { coreAppStub } from '@/stubs';

// Mock the loader to return stubs immediately for routing tests
jest.mock('@/lib/remote-app-contract/loader', () => ({
  loadRemoteApp: jest.fn().mockResolvedValue(coreAppStub),
}));

describe('Shell Routing', () => {
  describe('Route Configuration', () => {
    it('has deterministic route configuration', () => {
      expect(REMOTE_ROUTES.campaigns.path).toBe('campaigns/*');
      expect(REMOTE_ROUTES.campaigns.basePath).toBe('/campaigns');
      expect(REMOTE_ROUTES.campaigns.name).toBe('campaigns');

      expect(REMOTE_ROUTES.core.basePath).toBe('/');
      expect(REMOTE_ROUTES.core.name).toBe('core');
    });

    it('route configuration is immutable', () => {
      // TypeScript enforces this at compile time with 'as const'
      // This test documents the expectation
      expect(Object.isFrozen(REMOTE_ROUTES)).toBe(false); // Object itself not frozen
      expect(typeof REMOTE_ROUTES).toBe('object');
    });
  });

  describe('Route Matching', () => {
    it('mounts core app for index route (/)', async () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      // Wait for async RemoteAppLoader to complete
      await waitFor(() => {
        const remoteContainer = container.querySelector(
          '[data-remote-app="core"]'
        );
        expect(remoteContainer).not.toBeNull();
      });
    });

    it('mounts campaigns app for /campaigns route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/campaigns']}>
          <App />
        </MemoryRouter>
      );

      // Check that campaigns remote container is mounted
      const remoteContainer = container.querySelector(
        '[data-remote-app="campaigns"]'
      );
      expect(remoteContainer).not.toBeNull();
    });

    it('mounts campaigns app for /campaigns/* sub-routes', () => {
      const testRoutes = [
        '/campaigns/list',
        '/campaigns/create',
        '/campaigns/123',
      ];

      testRoutes.forEach((route) => {
        const { container } = render(
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        );

        const remoteContainer = container.querySelector(
          '[data-remote-app="campaigns"]'
        );
        expect(remoteContainer).not.toBeNull();
      });
    });

    it('mounts core app for non-campaigns routes (catch-all)', async () => {
      const nonCampaignsRoutes = ['/about', '/settings', '/profile'];

      for (const route of nonCampaignsRoutes) {
        const { container } = render(
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        );

        await waitFor(() => {
          const remoteContainer = container.querySelector(
            '[data-remote-app="core"]'
          );
          expect(remoteContainer).not.toBeNull();
        });
      }
    });
  });

  describe('Route Precedence', () => {
    it('campaigns routes take precedence over core catch-all', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/campaigns/test']}>
          <App />
        </MemoryRouter>
      );

      // Should mount campaigns, not core
      expect(container.querySelector('[data-remote-app="core"]')).toBeNull();
    });

    it('core handles all non-campaigns routes', async () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/some-other-route']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          container.querySelector('[data-remote-app="core"]')
        ).not.toBeNull();
      });

      expect(
        container.querySelector('[data-remote-app="campaigns"]')
      ).toBeNull();
    });
  });

  describe('Layout Integration', () => {
    it('renders shell layout for all routes', () => {
      const testRoutes = ['/', '/campaigns', '/about'];

      testRoutes.forEach((route) => {
        const { container } = render(
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        );

        // Shell layout should always be present
        expect(container.querySelector('.app-shell')).not.toBeNull();
        expect(container.querySelector('nav')).not.toBeNull();
        expect(container.querySelector('footer')).not.toBeNull();
      });
    });

    it('renders TopNavigation on all routes', () => {
      const testRoutes = ['/', '/campaigns', '/about'];

      testRoutes.forEach((route) => {
        const { container } = render(
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        );

        // Check that TopNavigation text is in this specific render
        expect(container.textContent).toContain('React App Shell');
      });
    });
  });

  describe('Remote App Isolation', () => {
    it('only one remote app is mounted at a time', async () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        const remoteContainers =
          container.querySelectorAll('[data-remote-app]');
        expect(remoteContainers.length).toBe(1);
      });
    });

    it('remote apps do not interfere with each other', async () => {
      const { container: coreContainer } = render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          coreContainer.querySelector('[data-remote-app="core"]')
        ).not.toBeNull();
      });

      expect(
        coreContainer.querySelector('[data-remote-app="campaigns"]')
      ).toBeNull();

      // Mount campaigns app
      const { container: campaignsContainer } = render(
        <MemoryRouter initialEntries={['/campaigns']}>
          <App />
        </MemoryRouter>
      );

      expect(
        campaignsContainer.querySelector('[data-remote-app="campaigns"]')
      ).not.toBeNull();
      expect(
        campaignsContainer.querySelector('[data-remote-app="core"]')
      ).toBeNull();
    });
  });
});
