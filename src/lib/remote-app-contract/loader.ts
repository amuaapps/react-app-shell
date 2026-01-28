import {
  RemoteAppConfig,
  RemoteAppInstance,
  RemoteAppError,
  RemoteAppErrorType,
  REMOTE_APP_CONTRACT_VERSION,
} from './types';

/**
 * Load a remote app with timeout and retry logic
 *
 * @param config - Configuration for the remote app to load
 * @returns Promise that resolves to the remote app instance
 * @throws RemoteAppError if loading fails after all retries
 */
export async function loadRemoteApp(
  config: RemoteAppConfig
): Promise<RemoteAppInstance> {
  const timeout = config.timeout ?? 10000;
  const maxRetries = config.retries ?? 2;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const instance = await loadRemoteAppWithTimeout(config, timeout);
      validateRemoteAppContract(instance, config.name);
      return instance;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await delay(1000 * (attempt + 1));
      }
    }
  }

  throw new RemoteAppError(
    RemoteAppErrorType.LOAD_FAILED,
    `Failed to load remote app "${config.name}" after ${maxRetries + 1} attempts: ${lastError?.message}`,
    config.name
  );
}

/**
 * Load a remote app with a timeout
 */
async function loadRemoteAppWithTimeout(
  config: RemoteAppConfig,
  timeout: number
): Promise<RemoteAppInstance> {
  return Promise.race([
    loadRemoteAppScript(config),
    createTimeout(timeout, config.name),
  ]);
}

/**
 * Load the remote app script and retrieve the instance
 *
 * For Module Federation apps, we need to:
 * 1. Load the remoteEntry.js script
 * 2. Explicitly import the bootstrap module to trigger initialization
 * 3. Retrieve the exposed instance from window
 */
async function loadRemoteAppScript(
  config: RemoteAppConfig
): Promise<RemoteAppInstance> {
  // Step 1: Load the remoteEntry.js script
  await loadRemoteEntryScript(config.url);

  // Step 2: Check if instance already exists (e.g., in tests)
  let instance = getRemoteAppInstance(config.name);

  // Step 3: If not, load the bootstrap module via Module Federation container
  // This is required for Module Federation to expose window.remoteApp_*
  if (!instance) {
    const containerName = `remoteApp_${config.name}`;
    try {
      // Access the Module Federation container
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const container = (window as any)[containerName];

      if (!container) {
        throw new Error(
          `Module Federation container '${containerName}' not found on window`
        );
      }

      // Initialize the container if needed
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (container.init) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await container.init({
          react: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            get: () => Promise.resolve(() => require('react')),
            loaded: true,
          },
          'react-dom': {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            get: () => Promise.resolve(() => require('react-dom')),
            loaded: true,
          },
        });
      }

      // Load the bootstrap module
      // container.get() returns a factory function
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const factory = await container.get('./bootstrap');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      console.warn(
        `🔍 Before factory() call, window.${containerName}:`,
        (window as any)[containerName]
      );

      // Call the factory - this executes the bootstrap code as a side effect
      // which sets window.remoteApp_core
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const result = factory();

      console.warn(`🔍 Factory returned:`, result);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      console.warn(
        `🔍 After factory() call, window.${containerName}:`,
        (window as any)[containerName]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      console.warn(
        `🔍 window.${containerName} keys:`,
        (window as any)[containerName]
          ? Object.keys((window as any)[containerName])
          : 'null'
      );

      // Retrieve the instance from window after bootstrap execution
      instance = getRemoteAppInstance(config.name);
    } catch (error) {
      console.error(
        `❌ Failed to load bootstrap module from ${containerName}`,
        error
      );
      throw new Error(
        `Failed to load bootstrap module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Step 4: Verify instance exists
  if (instance) {
    console.warn(`✅ Remote app "${config.name}" loaded successfully`);
    return instance;
  } else {
    const globalKey = `remoteApp_${config.name}`;
    console.error(
      `❌ Remote app "${config.name}" did not expose an instance on window.${globalKey}`,
      'Available window properties:',
      Object.keys(window).filter((k) => k.startsWith('remoteApp'))
    );
    throw new Error(
      `Remote app "${config.name}" did not expose an instance on window.${globalKey}`
    );
  }
}

/**
 * Load the remoteEntry.js script into the document
 */
function loadRemoteEntryScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'module';

    script.onload = () => {
      resolve();
    };

    script.onerror = (error) => {
      console.error(`❌ Failed to load script from ${url}`, error);
      reject(new Error(`Failed to load script from ${url}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Retrieve the remote app instance from the global scope
 * Remote apps should expose themselves as window[`remoteApp_${name}`]
 */
function getRemoteAppInstance(name: string): RemoteAppInstance | null {
  const globalKey = `remoteApp_${name}`;
  return (
    (window as unknown as Record<string, RemoteAppInstance>)[globalKey] || null
  );
}

/**
 * Create a timeout promise that rejects after the specified duration
 */
function createTimeout(ms: number, remoteName: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new RemoteAppError(
          RemoteAppErrorType.LOAD_TIMEOUT,
          `Timeout loading remote app "${remoteName}" after ${ms}ms`,
          remoteName
        )
      );
    }, ms);
  });
}

/**
 * Validate that the remote app implements the required contract
 */
function validateRemoteAppContract(
  instance: RemoteAppInstance,
  remoteName: string
): void {
  if (!instance.mount || typeof instance.mount !== 'function') {
    console.error(
      `❌ Remote app "${remoteName}" validation failed. Instance properties:`,
      {
        hasMount: !!instance.mount,
        mountType: typeof instance.mount,
        hasUnmount: !!instance.unmount,
        hasContractVersion: !!instance.contractVersion,
        contractVersion: instance.contractVersion,
        allKeys: Object.keys(instance),
        instance: instance,
      }
    );
    throw new RemoteAppError(
      RemoteAppErrorType.INVALID_CONTRACT,
      `Remote app "${remoteName}" does not implement required mount() function`,
      remoteName
    );
  }

  if (!instance.contractVersion) {
    throw new RemoteAppError(
      RemoteAppErrorType.INVALID_CONTRACT,
      `Remote app "${remoteName}" does not specify a contractVersion`,
      remoteName
    );
  }

  if (instance.contractVersion !== REMOTE_APP_CONTRACT_VERSION) {
    throw new RemoteAppError(
      RemoteAppErrorType.INCOMPATIBLE_VERSION,
      `Remote app "${remoteName}" uses contract version ${instance.contractVersion}, but shell expects version ${REMOTE_APP_CONTRACT_VERSION}`,
      remoteName
    );
  }
}

/**
 * Delay execution for the specified duration
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
