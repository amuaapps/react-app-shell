/**
 * Tests for analytics consent management
 */

import {
  getConsent,
  setConsent,
  isAnalyticsEnabled,
} from '@/analytics/consent';

describe('Analytics Consent', () => {
  beforeEach(() => {
    // Reset consent to defaults before each test
    setConsent({
      analytics: true,
      experimentation: false,
      personalization: false,
    });
  });

  describe('getConsent', () => {
    it('should return default consent state', () => {
      const consent = getConsent();

      expect(consent).toEqual({
        analytics: true,
        experimentation: false,
        personalization: false,
        timestamp: expect.any(String),
      });
    });

    it('should have valid ISO timestamp', () => {
      const consent = getConsent();
      const timestamp = new Date(consent.timestamp);

      expect(timestamp.toISOString()).toBe(consent.timestamp);
    });
  });

  describe('setConsent', () => {
    it('should update analytics consent', () => {
      setConsent({ analytics: false });
      const consent = getConsent();

      expect(consent.analytics).toBe(false);
      expect(consent.experimentation).toBe(false);
      expect(consent.personalization).toBe(false);
    });

    it('should update experimentation consent', () => {
      setConsent({ experimentation: true });
      const consent = getConsent();

      expect(consent.analytics).toBe(true);
      expect(consent.experimentation).toBe(true);
      expect(consent.personalization).toBe(false);
    });

    it('should update personalization consent', () => {
      setConsent({ personalization: true });
      const consent = getConsent();

      expect(consent.analytics).toBe(true);
      expect(consent.experimentation).toBe(false);
      expect(consent.personalization).toBe(true);
    });

    it('should update multiple consent flags at once', () => {
      setConsent({
        analytics: false,
        experimentation: true,
        personalization: true,
      });
      const consent = getConsent();

      expect(consent.analytics).toBe(false);
      expect(consent.experimentation).toBe(true);
      expect(consent.personalization).toBe(true);
    });

    it('should update timestamp when consent changes', () => {
      const consent1 = getConsent();
      const timestamp1 = consent1.timestamp;

      // Wait a bit to ensure timestamp changes
      jest.advanceTimersByTime(10);

      setConsent({ analytics: false });
      const consent2 = getConsent();

      expect(consent2.timestamp).not.toBe(timestamp1);
    });
  });

  describe('isAnalyticsEnabled', () => {
    it('should return true when analytics consent is granted', () => {
      setConsent({ analytics: true });

      expect(isAnalyticsEnabled()).toBe(true);
    });

    it('should return false when analytics consent is denied', () => {
      setConsent({ analytics: false });

      expect(isAnalyticsEnabled()).toBe(false);
    });
  });
});
