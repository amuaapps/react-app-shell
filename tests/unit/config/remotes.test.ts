import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getRemoteConfig,
  getRemoteUrl,
  isValidRemoteUrl,
} from '@/config/remotes';
import { setEnvProvider, StaticEnvProvider, getEnvProvider } from '@/lib/env-provider';

describe('Remote Configuration', () => {
  let originalProvider: ReturnType<typeof getEnvProvider>;

  beforeEach(() => {
    // Save original provider
    originalProvider = getEnvProvider();
  });

  afterEach(() => {
    // Restore original provider
    setEnvProvider(originalProvider);
  });

  describe('getRemoteConfig', () => {
    it('should return default configuration when no env vars set', () => {
      // Use empty provider to test defaults
      setEnvProvider(new StaticEnvProvider({}));

      const config = getRemoteConfig();

      expect(config).toHaveProperty('coreRemoteEntryUrl');
      expect(config).toHaveProperty('campaignsRemoteEntryUrl');
      expect(config.coreRemoteEntryUrl).toContain('localhost:3002');
      expect(config.campaignsRemoteEntryUrl).toContain('localhost:3003');
    });

    it('should use environment variables when set', () => {
      // Inject custom env values
      setEnvProvider(
        new StaticEnvProvider({
          CORE_REMOTE_ENTRY_URL: 'https://core.example.com/entry.js',
          CAMPAIGNS_REMOTE_ENTRY_URL: 'https://campaigns.example.com/entry.js',
        })
      );

      const config = getRemoteConfig();

      expect(config.coreRemoteEntryUrl).toBe('https://core.example.com/entry.js');
      expect(config.campaignsRemoteEntryUrl).toBe('https://campaigns.example.com/entry.js');
    });

    it('should fall back to defaults for missing env vars', () => {
      // Only set one env var
      setEnvProvider(
        new StaticEnvProvider({
          CORE_REMOTE_ENTRY_URL: 'https://core.example.com/entry.js',
        })
      );

      const config = getRemoteConfig();

      expect(config.coreRemoteEntryUrl).toBe('https://core.example.com/entry.js');
      expect(config.campaignsRemoteEntryUrl).toContain('localhost:3003');
    });

    it('returns valid URLs', () => {
      const config = getRemoteConfig();

      expect(config.coreRemoteEntryUrl).toContain('remoteEntry.js');
      expect(config.campaignsRemoteEntryUrl).toContain('remoteEntry.js');
    });
  });

  describe('getRemoteUrl', () => {
    it('returns a URL for core remote', () => {
      const url = getRemoteUrl('core');
      expect(typeof url).toBe('string');
      expect(url).toContain('remoteEntry.js');
    });

    it('returns a URL for campaigns remote', () => {
      const url = getRemoteUrl('campaigns');
      expect(typeof url).toBe('string');
      expect(url).toContain('remoteEntry.js');
    });

    it('throws error for invalid remote name', () => {
      expect(() => getRemoteUrl('invalid' as 'core')).toThrow(
        'Unknown remote application: invalid'
      );
    });
  });

  describe('isValidRemoteUrl', () => {
    it('returns true for valid http URL', () => {
      expect(isValidRemoteUrl('http://localhost:3002/remoteEntry.js')).toBe(
        true
      );
    });

    it('returns true for valid https URL', () => {
      expect(isValidRemoteUrl('https://example.com/remoteEntry.js')).toBe(true);
    });

    it('returns false for invalid URL', () => {
      expect(isValidRemoteUrl('not-a-url')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidRemoteUrl('')).toBe(false);
    });

    it('returns false for non-http(s) protocol', () => {
      expect(isValidRemoteUrl('ftp://example.com/file.js')).toBe(false);
    });
  });
});
