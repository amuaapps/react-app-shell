import { getRemoteConfig, getRemoteUrl, isValidRemoteUrl } from '@/config/remotes';

describe('Remote Configuration', () => {
  describe('getRemoteConfig', () => {
    it('returns configuration object with both remote URLs', () => {
      const config = getRemoteConfig();
      
      expect(config).toHaveProperty('coreRemoteEntryUrl');
      expect(config).toHaveProperty('campaignsRemoteEntryUrl');
      expect(typeof config.coreRemoteEntryUrl).toBe('string');
      expect(typeof config.campaignsRemoteEntryUrl).toBe('string');
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
      expect(() => getRemoteUrl('invalid' as 'core')).toThrow('Unknown remote application: invalid');
    });
  });

  describe('isValidRemoteUrl', () => {
    it('returns true for valid http URL', () => {
      expect(isValidRemoteUrl('http://localhost:3002/remoteEntry.js')).toBe(true);
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
