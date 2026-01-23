/**
 * RemoteAppMount Component
 *
 * Mounts a remote micro-frontend app using the RemoteAppInstance contract.
 * Handles mounting, unmounting, and navigation synchronization.
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RemoteAppInstance } from '@/lib/remote-app-contract';
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
    if (!container) {
      console.warn(`RemoteAppMount: Container not ready for "${name}"`);
      return;
    }

    // Prevent double mounting
    if (mountedRef.current) {
      console.log(`RemoteAppMount: Already mounted "${name}"`);
      return;
    }

    console.log(`RemoteAppMount: Mounting "${name}" at ${location.pathname}`);

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
          console.error(`Failed to mount remote app "${name}":`, result.error);
          return;
        }

        console.log(`RemoteAppMount: Successfully mounted "${name}"`);
        mountedRef.current = true;
        unmountFnRef.current = remoteApp.unmount
          ? () => remoteApp.unmount!()
          : null;
      } catch (error) {
        console.error(`Failed to mount remote app "${name}":`, error);
      }
    };

    void mountRemote();

    return () => {
      if (mountedRef.current && unmountFnRef.current) {
        void unmountFnRef.current();
        mountedRef.current = false;
        unmountFnRef.current = null;
      }
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
