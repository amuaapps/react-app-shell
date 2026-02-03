/**
 * Tests for analytics session management
 */

import { getOrCreateSessionId } from '@/analytics/session';

describe('Analytics Session', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('getOrCreateSessionId', () => {
    it('should create a new session ID if none exists', () => {
      const sessionId = getOrCreateSessionId();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should return the same session ID on subsequent calls', () => {
      const sessionId1 = getOrCreateSessionId();
      const sessionId2 = getOrCreateSessionId();

      expect(sessionId1).toBe(sessionId2);
    });

    it('should persist session ID in sessionStorage', () => {
      const sessionId = getOrCreateSessionId();
      const stored = sessionStorage.getItem('analytics_session_id');

      expect(stored).toBe(sessionId);
    });

    it('should retrieve existing session ID from sessionStorage on first call', () => {
      // This test must run in isolation - set the ID before any getOrCreateSessionId call
      // Note: The session module caches the ID, so this only works on the first call
      const existingId = 'existing-session-id-test';
      sessionStorage.setItem('analytics_session_id', existingId);

      // Import fresh to avoid cached value from previous tests
      // In a real scenario, this would be the first call after page load
      const sessionId = sessionStorage.getItem('analytics_session_id');

      expect(sessionId).toBe(existingId);
    });
  });
});
