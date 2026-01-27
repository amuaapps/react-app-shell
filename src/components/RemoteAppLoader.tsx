/**
 * RemoteAppLoader Component
 *
 * Dynamically loads remote micro-frontend apps with fallback to stubs.
 * Handles loading, error states, and provides graceful degradation.
 */

import { useEffect, useState } from 'react';
import { RemoteAppInstance } from '@/lib/remote-app-contract';
import { loadRemoteApp } from '@/lib/remote-app-contract/loader';
import { reportError } from '@/lib/error-reporter';
import RemoteAppMount from './RemoteAppMount';

interface RemoteAppLoaderProps {
  /**
   * Name of the remote app (for error reporting and caching)
   */
  name: string;

  /**
   * URL to the remote app's entry point
   */
  remoteUrl: string;

  /**
   * Base path the remote app owns (e.g., "/campaigns")
   */
  basePath: string;

  /**
   * Fallback stub to use if remote app fails to load
   */
  fallbackStub: RemoteAppInstance;

  /**
   * Module Federation remote name (e.g., "remoteApp_core")
   */
  remoteName: string;
}

export default function RemoteAppLoader({
  name,
  remoteUrl,
  basePath,
  fallbackStub,
  remoteName,
}: RemoteAppLoaderProps) {
  const [remoteApp, setRemoteApp] = useState<RemoteAppInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadRemote = async () => {
      try {
        setIsLoading(true);

        // Attempt to load the remote app
        const instance = await loadRemoteApp({
          name: remoteName,
          url: remoteUrl,
          basePath,
          timeout: 10000, // 10 second timeout
          retries: 2,
        });

        if (mounted) {
          setRemoteApp(instance);
          setIsLoading(false);
          setUseFallback(false);
        }
      } catch (error) {
        reportError(`Failed to load remote app "${name}"`, error, {
          remoteName: name,
          remoteUrl,
        });

        if (mounted) {
          // Fall back to stub
          setRemoteApp(fallbackStub);
          setIsLoading(false);
          setUseFallback(true);
        }
      }
    };

    void loadRemote();

    return () => {
      mounted = false;
    };
  }, [name, remoteUrl, remoteName, basePath, fallbackStub]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading {name}...</p>
        </div>
      </div>
    );
  }

  if (!remoteApp) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive">Failed to load {name}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {useFallback && (
        <div className="bg-warning/10 border-l-4 border-warning p-4 mb-4">
          <p className="text-sm text-warning-foreground">
            <strong>Development Mode:</strong> Using local stub for {name}. The
            remote app could not be loaded from {remoteUrl}
          </p>
        </div>
      )}
      <RemoteAppMount remoteApp={remoteApp} basePath={basePath} name={name} />
    </>
  );
}
