// Mock for src/config/remotes.ts
// Used in Jest tests since Jest can't handle import.meta.env

export interface RemoteConfig {
  coreRemoteEntryUrl: string;
  campaignsRemoteEntryUrl: string;
}

const DEFAULT_CONFIG: RemoteConfig = {
  coreRemoteEntryUrl: 'http://localhost:3002/remoteEntry.js',
  campaignsRemoteEntryUrl: 'http://localhost:3003/remoteEntry.js',
};

export function getRemoteConfig(): RemoteConfig {
  return DEFAULT_CONFIG;
}

export function isValidRemoteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getRemoteUrl(remoteName: 'core' | 'campaigns'): string {
  const config = getRemoteConfig();
  
  switch (remoteName) {
    case 'core':
      return config.coreRemoteEntryUrl;
    case 'campaigns':
      return config.campaignsRemoteEntryUrl;
    default:
      throw new Error(`Unknown remote application: ${remoteName}`);
  }
}
