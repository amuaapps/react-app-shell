/**
 * Campaigns App Stub - Local development placeholder
 *
 * This stub implements the RemoteAppContract for local development and testing.
 * It provides a minimal placeholder UI for the campaigns app (/campaigns/* routes).
 *
 * NOTE: This is for development only. In production, the real campaigns app will be loaded.
 */

import {
  RemoteAppInstance,
  RemoteAppMountOptions,
} from '@/lib/remote-app-contract';

/**
 * Campaigns App Stub Contract Implementation
 */
export const campaignsAppStub: RemoteAppInstance = {
  contractVersion: '1',

  mount: (container: HTMLElement, options: RemoteAppMountOptions) => {
    try {
      const { initialPath, onNavigate } = options;

      // Render stub content directly as HTML for simplicity in tests
      container.innerHTML = `
        <div class="p-8">
          <div class="max-w-4xl mx-auto">
            <div class="bg-secondary/10 border-2 border-secondary rounded-lg p-6 mb-6">
              <h1 class="text-3xl font-bold text-foreground mb-2">Campaigns App Placeholder</h1>
              <p class="text-muted-foreground mb-4">
                This is a local development stub. The real campaigns app will be loaded from a
                remote entry point in production.
              </p>
              <p class="text-sm text-muted-foreground">
                Current route: <code class="bg-muted px-2 py-1 rounded">${initialPath}</code>
              </p>
            </div>
            <div class="space-y-4">
              <div class="bg-card border border-border rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-3">Navigation Demo</h2>
                <p class="text-muted-foreground mb-4">
                  Click the links below to test navigation within the campaigns app:
                </p>
                <div class="flex flex-wrap gap-3">
                  <button data-nav="/campaigns" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors">
                    Campaigns Home
                  </button>
                  <button data-nav="/campaigns/list" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors">
                    Campaign List
                  </button>
                  <button data-nav="/campaigns/create" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors">
                    Create Campaign
                  </button>
                  <button data-nav="/" class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                    ← Back to Core
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add click handlers for navigation
      if (onNavigate) {
        const buttons = container.querySelectorAll('[data-nav]');
        buttons.forEach((button) => {
          button.addEventListener('click', () => {
            const path = button.getAttribute('data-nav');
            if (path) onNavigate(path);
          });
        });
      }

      return Promise.resolve({ success: true });
    } catch (error) {
      return Promise.resolve({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to mount campaigns app stub',
      });
    }
  },

  unmount: () => {
    // Cleanup handled by container.innerHTML = ''
    return Promise.resolve();
  },
};
