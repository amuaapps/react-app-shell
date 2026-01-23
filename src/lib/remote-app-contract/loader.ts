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
 */
async function loadRemoteAppScript(
  config: RemoteAppConfig
): Promise<RemoteAppInstance> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = config.url;
    script.type = 'module';

    script.onload = () => {
      const instance = getRemoteAppInstance(config.name);
      if (instance) {
        resolve(instance);
      } else {
        reject(
          new Error(
            `Remote app "${config.name}" did not expose an instance on window`
          )
        );
      }
    };

    script.onerror = () => {
      reject(new Error(`Failed to load script from ${config.url}`));
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
