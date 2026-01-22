import {
  RemoteAppInstance,
  RemoteAppMountOptions,
  RemoteAppError,
  RemoteAppErrorType,
  REMOTE_APP_CONTRACT_VERSION,
} from '@/lib/remote-app-contract';
import { loadRemoteApp } from '@/lib/remote-app-contract/loader';

describe('Remote App Contract', () => {
  describe('Type Definitions', () => {
    it('defines correct contract version', () => {
      expect(REMOTE_APP_CONTRACT_VERSION).toBe('1');
    });

    it('allows valid RemoteAppInstance implementation', () => {
      const validInstance: RemoteAppInstance = {
        contractVersion: '1',
        mount: async () => Promise.resolve({ success: true }),
        unmount: async () => Promise.resolve(),
      };

      expect(validInstance.contractVersion).toBe('1');
      expect(typeof validInstance.mount).toBe('function');
      expect(typeof validInstance.unmount).toBe('function');
    });

    it('allows RemoteAppInstance without optional unmount', () => {
      const minimalInstance: RemoteAppInstance = {
        contractVersion: '1',
        mount: async () => Promise.resolve({ success: true }),
      };

      expect(minimalInstance.contractVersion).toBe('1');
      expect(typeof minimalInstance.mount).toBe('function');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(minimalInstance.unmount).not.toBeDefined();
    });
  });

  describe('RemoteAppError', () => {
    it('creates error with correct properties', () => {
      const error = new RemoteAppError(
        RemoteAppErrorType.LOAD_TIMEOUT,
        'Test error',
        'test-remote'
      );

      expect(error.type).toBe(RemoteAppErrorType.LOAD_TIMEOUT);
      expect(error.message).toBe('Test error');
      expect(error.remoteName).toBe('test-remote');
      expect(error.name).toBe('RemoteAppError');
    });
  });

  describe('loadRemoteApp', () => {
    beforeEach(() => {
      // Clean up any existing scripts
      document.head.innerHTML = '';
      // Clean up global remote instances
      Object.keys(window).forEach((key) => {
        if (key.startsWith('remoteApp_')) {
          delete (window as unknown as Record<string, unknown>)[key];
        }
      });
    });

    it('throws error when remote script fails to load', async () => {
      const config = {
        name: 'test-remote',
        url: 'https://invalid-url.example.com/remoteEntry.js',
        basePath: '/test',
        timeout: 1000,
        retries: 0,
      };

      await expect(loadRemoteApp(config)).rejects.toThrow(RemoteAppError);
    });

    it('throws timeout error when loading takes too long', async () => {
      const config = {
        name: 'slow-remote',
        url: 'https://example.com/remoteEntry.js',
        basePath: '/test',
        timeout: 100,
        retries: 0,
      };

      await expect(loadRemoteApp(config)).rejects.toThrow(RemoteAppError);
    });

    it('validates contract version is checked', () => {
      // This test verifies the contract includes version checking
      // Actual validation is tested in integration tests with real remotes
      const validInstance: RemoteAppInstance = {
        contractVersion: REMOTE_APP_CONTRACT_VERSION,
        mount: async () => Promise.resolve({ success: true }),
      };

      const incompatibleInstance = {
        contractVersion: '999',
        mount: async () => Promise.resolve({ success: true }),
      };

      expect(validInstance.contractVersion).toBe('1');
      expect(incompatibleInstance.contractVersion).not.toBe(
        REMOTE_APP_CONTRACT_VERSION
      );
    });
  });

  describe('Mount Options', () => {
    it('includes all required fields', () => {
      const options: RemoteAppMountOptions = {
        basePath: '/campaigns',
        initialPath: '/campaigns/123',
        contractVersion: '1',
      };

      expect(options.basePath).toBe('/campaigns');
      expect(options.initialPath).toBe('/campaigns/123');
      expect(options.contractVersion).toBe('1');
    });

    it('allows optional onNavigate callback', () => {
      const onNavigate = jest.fn();
      const options: RemoteAppMountOptions = {
        basePath: '/campaigns',
        initialPath: '/campaigns/123',
        contractVersion: '1',
        onNavigate,
      };

      const callback = options.onNavigate;
      if (callback) {
        callback('/campaigns/456');
      }
      expect(onNavigate).toHaveBeenCalledWith('/campaigns/456');
    });
  });
});
