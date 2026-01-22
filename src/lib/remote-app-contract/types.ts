/**
 * Remote App Mount Contract v1
 *
 * This contract defines how the shell loads and mounts remote micro-frontend apps.
 * Remote apps must implement this contract to be compatible with the shell.
 *
 * Version: 1
 */

export const REMOTE_APP_CONTRACT_VERSION = '1';

/**
 * Navigation callback that remote apps can use to request route changes
 */
export type NavigationCallback = (path: string) => void;

/**
 * Options passed to the remote app's mount function
 */
export interface RemoteAppMountOptions {
  /**
   * Base path that the remote app owns (e.g., "/campaigns")
   * The remote should handle all routes under this base path
   */
  basePath: string;

  /**
   * Initial path to render (e.g., "/campaigns/123")
   * The remote should navigate to this path on mount
   */
  initialPath: string;

  /**
   * Optional callback for the remote to request navigation changes
   * The shell will update the browser URL and handle cross-app navigation
   */
  onNavigate?: NavigationCallback;

  /**
   * Contract version the shell is using
   * Remote apps can check this to ensure compatibility
   */
  contractVersion: string;
}

/**
 * Result returned by the mount function
 */
export interface RemoteAppMountResult {
  /**
   * Whether the mount was successful
   */
  success: boolean;

  /**
   * Error message if mount failed
   */
  error?: string;
}

/**
 * Remote app instance that the shell interacts with
 */
export interface RemoteAppInstance {
  /**
   * Mount the remote app into the provided container
   *
   * @param container - DOM element where the remote should render
   * @param options - Mount options including basePath and initialPath
   * @returns Promise that resolves when mount is complete
   */
  mount(
    container: HTMLElement,
    options: RemoteAppMountOptions
  ): Promise<RemoteAppMountResult>;

  /**
   * Optional: Unmount the remote app and clean up resources
   *
   * @returns Promise that resolves when unmount is complete
   */
  unmount?(): Promise<void>;

  /**
   * Contract version the remote app implements
   * Used to detect compatibility issues
   */
  contractVersion: string;
}

/**
 * Configuration for loading a remote app
 */
export interface RemoteAppConfig {
  /**
   * Unique identifier for the remote app
   */
  name: string;

  /**
   * URL to the remote app's entry point (e.g., "https://cdn.example.com/campaigns/remoteEntry.js")
   */
  url: string;

  /**
   * Base path the remote app owns (e.g., "/campaigns")
   */
  basePath: string;

  /**
   * Timeout in milliseconds for loading the remote (default: 10000)
   */
  timeout?: number;

  /**
   * Number of retry attempts if loading fails (default: 2)
   */
  retries?: number;
}

/**
 * Error types that can occur when loading/mounting remote apps
 */
export enum RemoteAppErrorType {
  LOAD_TIMEOUT = 'LOAD_TIMEOUT',
  LOAD_FAILED = 'LOAD_FAILED',
  MOUNT_FAILED = 'MOUNT_FAILED',
  INCOMPATIBLE_VERSION = 'INCOMPATIBLE_VERSION',
  INVALID_CONTRACT = 'INVALID_CONTRACT',
}

/**
 * Error thrown when remote app operations fail
 */
export class RemoteAppError extends Error {
  constructor(
    public type: RemoteAppErrorType,
    message: string,
    public remoteName?: string
  ) {
    super(message);
    this.name = 'RemoteAppError';
  }
}
