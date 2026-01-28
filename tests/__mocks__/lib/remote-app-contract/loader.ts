/**
 * Mock for loadRemoteApp in tests
 * Returns stubs immediately instead of trying to load from network or import bootstrap
 */

import {
  RemoteAppConfig,
  RemoteAppInstance,
} from '../../../../src/lib/remote-app-contract/types';
import { coreAppStub, campaignsAppStub } from '../../../../src/stubs';

export async function loadRemoteApp(
  config: RemoteAppConfig
): Promise<RemoteAppInstance> {
  // In tests, immediately return the appropriate stub based on the remote name
  // This bypasses the bootstrap import which would fail in test environment
  if (config.name === 'core') {
    return Promise.resolve(coreAppStub);
  }

  if (config.name === 'campaigns') {
    return Promise.resolve(campaignsAppStub);
  }

  // Default fallback
  return Promise.resolve(coreAppStub);
}
