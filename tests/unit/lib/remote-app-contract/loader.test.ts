/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { loadRemoteApp } from '@/lib/remote-app-contract/loader';
import {
  RemoteAppConfig,
  RemoteAppInstance,
  REMOTE_APP_CONTRACT_VERSION,
} from '@/lib/remote-app-contract/types';

describe('loadRemoteApp', () => {
  let mockScript: HTMLScriptElement;

  beforeEach(() => {
    // Clear any existing remote apps from window
    Object.keys(window).forEach((key) => {
      if (key.startsWith('remoteApp_')) {
        delete (window as any)[key];
      }
    });

    // Mock document.createElement for script
    mockScript = {
      src: '',
      type: '',
      onload: null,
      onerror: null,
    } as unknown as HTMLScriptElement;

    jest.spyOn(document, 'createElement').mockReturnValue(mockScript as HTMLScriptElement);
    jest.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript as Node);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should load a valid remote app successfully', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
    };

    const mockInstance: RemoteAppInstance = {
      mount: jest.fn(),
      unmount: jest.fn(),
      contractVersion: REMOTE_APP_CONTRACT_VERSION,
    };

    // Simulate successful script load
    setTimeout(() => {
      (window as any)[`remoteApp_${config.name}`] = mockInstance;
      const onload = mockScript.onload;
      onload?.(new Event('load'));
    }, 10);

    const result = await loadRemoteApp(config);

    expect(result).toBe(mockInstance);
    expect(document.createElement).toHaveBeenCalledWith('script');
    expect(mockScript.src).toBe(config.url);
    expect(mockScript.type).toBe('module');
  });

  it('should retry on failure and succeed on second attempt', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      retries: 2,
    };

    const mockInstance: RemoteAppInstance = {
      mount: jest.fn(),
      unmount: jest.fn(),
      contractVersion: REMOTE_APP_CONTRACT_VERSION,
    };

    let attemptCount = 0;

    // Mock appendChild to trigger script load
    jest.spyOn(document.head, 'appendChild').mockImplementation(() => {
      attemptCount++;
      setTimeout(() => {
        if (attemptCount === 1) {
          // First attempt fails
          const onerror = mockScript.onerror;
        onerror?.(new Event('error'));
        } else {
          // Second attempt succeeds
          (window as any)[`remoteApp_${config.name}`] = mockInstance;
          const onload = mockScript.onload;
      onload?.(new Event('load'));
        }
      }, 10);
      return mockScript as Node;
    });

    const result = await loadRemoteApp(config);

    expect(result).toBe(mockInstance);
    expect(attemptCount).toBe(2);
  });

  it('should throw error after max retries', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      retries: 1,
      timeout: 100,
    };

    jest.spyOn(document.head, 'appendChild').mockImplementation(() => {
      setTimeout(() => {
        const onerror = mockScript.onerror;
        onerror?.(new Event('error'));
      }, 10);
      return mockScript as Node;
    });

    await expect(loadRemoteApp(config)).rejects.toThrow(
      /Failed to load remote app "test-app" after 2 attempts/
    );
  }, 10000);

  it('should throw error if remote app does not expose instance', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      retries: 0,
    };

    // Simulate successful script load but no instance
    setTimeout(() => {
      const onload = mockScript.onload;
      onload?.(new Event('load'));
    }, 10);

    await expect(loadRemoteApp(config)).rejects.toThrow(
      /Remote app "test-app" did not expose an instance on window/
    );
  });

  it('should throw error if mount function is missing', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      retries: 0,
    };

    const invalidInstance = {
      contractVersion: REMOTE_APP_CONTRACT_VERSION,
    } as any;

    setTimeout(() => {
      (window as any)[`remoteApp_${config.name}`] = invalidInstance;
      const onload = mockScript.onload;
      onload?.(new Event('load'));
    }, 10);

    await expect(loadRemoteApp(config)).rejects.toThrow(
      /does not implement required mount\(\) function/
    );
  });

  it('should throw error if contractVersion is missing', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      retries: 0,
    };

    const invalidInstance = {
      mount: jest.fn(),
    } as any;

    setTimeout(() => {
      (window as any)[`remoteApp_${config.name}`] = invalidInstance;
      const onload = mockScript.onload;
      onload?.(new Event('load'));
    }, 10);

    await expect(loadRemoteApp(config)).rejects.toThrow(
      /does not specify a contractVersion/
    );
  });

  it('should throw error if contractVersion is incompatible', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      retries: 0,
    };

    const invalidInstance: RemoteAppInstance = {
      mount: jest.fn(),
      contractVersion: '999',
    };

    setTimeout(() => {
      (window as any)[`remoteApp_${config.name}`] = invalidInstance;
      const onload = mockScript.onload;
      onload?.(new Event('load'));
    }, 10);

    await expect(loadRemoteApp(config)).rejects.toThrow(
      /uses contract version 999, but shell expects version/
    );
  });

  it('should timeout if loading takes too long', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      timeout: 100,
      retries: 0,
    };

    // Never trigger onload - let it timeout
    jest
      .spyOn(document.head, 'appendChild')
      .mockImplementation(() => mockScript as any);

    await expect(loadRemoteApp(config)).rejects.toThrow(
      /Timeout loading remote app "test-app" after 100ms/
    );
  }, 10000);

  it('should use default timeout if not specified', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      retries: 0,
    };

    const mockInstance: RemoteAppInstance = {
      mount: jest.fn(),
      unmount: jest.fn(),
      contractVersion: REMOTE_APP_CONTRACT_VERSION,
    };

    setTimeout(() => {
      (window as any)[`remoteApp_${config.name}`] = mockInstance;
      const onload = mockScript.onload;
      onload?.(new Event('load'));
    }, 10);

    const result = await loadRemoteApp(config);
    expect(result).toBe(mockInstance);
  });

  it('should use default retries if not specified', async () => {
    const config: RemoteAppConfig = {
      name: 'test-app',
      url: 'http://localhost:3000/remoteEntry.js',
      timeout: 100,
    };

    let attemptCount = 0;

    jest.spyOn(document.head, 'appendChild').mockImplementation(() => {
      attemptCount++;
      setTimeout(() => {
        const onerror = mockScript.onerror;
        onerror?.(new Event('error'));
      }, 10);
      return mockScript as Node;
    });

    await expect(loadRemoteApp(config)).rejects.toThrow();
    // Default retries is 2, so total attempts = 3 (initial + 2 retries)
    expect(attemptCount).toBe(3);
  }, 15000);
});
