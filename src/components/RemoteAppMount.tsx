/**
 * RemoteAppMount Component
 *
 * Mounts a remote micro-frontend app using the RemoteAppInstance contract.
 * Handles mounting, unmounting, and navigation synchronization.
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RemoteAppInstance } from '@/lib/remote-app-contract';
import { reportError } from '@/lib/error-reporter';
import RemoteAppErrorBoundary from './RemoteAppErrorBoundary';

interface RemoteAppMountProps {
  /**
   * Remote app instance to mount
   */
  remoteApp: RemoteAppInstance;

  /**
   * Base path the remote app owns (e.g., "/campaigns")
   */
  basePath: string;

  /**
   * Name of the remote app (for error reporting)
   */
  name: string;
}

export default function RemoteAppMount({
  remoteApp,
  basePath,
  name,
}: RemoteAppMountProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const mountedRef = useRef(false);
  const unmountFnRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevent double mounting
    if (mountedRef.current) return;

    const mountRemote = async () => {
      try {
        const result = await remoteApp.mount(container, {
          basePath,
          initialPath: location.pathname,
          onNavigate: (path: string) => {
            navigate(path);
          },
          contractVersion: '1',
        });

        if (!result.success) {
          reportError(`Failed to mount remote app "${name}"`, result.error, {
            remoteName: name,
            basePath,
          });
          return;
        }

        mountedRef.current = true;
        unmountFnRef.current = remoteApp.unmount
          ? () => remoteApp.unmount!()
          : null;
      } catch (error) {
        reportError(`Failed to mount remote app "${name}"`, error, {
          remoteName: name,
          basePath,
        });
      }
    };

    void mountRemote();

    return () => {
      // Always cleanup, regardless of whether remote implements unmount
      const cleanup = async () => {
        // Call remote's unmount if available
        if (unmountFnRef.current) {
          try {
            await unmountFnRef.current();
          } catch (error) {
            reportError(`Error during unmount of remote app "${name}"`, error, {
              remoteName: name,
              basePath,
            });
          }
        }

        // Always clear container DOM to prevent stale content
        if (container) {
          container.innerHTML = '';
        }

        // Always reset state to allow remounting
        mountedRef.current = false;
        unmountFnRef.current = null;
      };

      void cleanup();
    };
  }, [remoteApp, basePath, name, location.pathname, navigate]);

  return (
    <RemoteAppErrorBoundary remoteName={name}>
      <div
        ref={containerRef}
        data-remote-app={name}
        className="remote-app-container"
      />
    </RemoteAppErrorBoundary>
  );
}
