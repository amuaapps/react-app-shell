/**
 * Integration tests for analytics system
 *
 * Tests the full analytics flow from React components through to transport
 */

import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AnalyticsProvider } from '@/analytics/context';
import { useAnalytics } from '@/analytics/hooks';
import { useShellPageViews } from '@/analytics/pageViews';
import { setConsent } from '@/analytics/consent';
import type { ReactNode } from 'react';

// Mock fetch globally
global.fetch = jest.fn();

describe('Analytics Integration', () => {
  beforeEach(() => {
    // Use fake timers for deterministic testing
    jest.useFakeTimers();

    // Clear all mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    // Clear sessionStorage
    sessionStorage.clear();

    // Reset consent to defaults
    setConsent({
      analytics: true,
      experimentation: false,
      personalization: false,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <AnalyticsProvider>{children}</AnalyticsProvider>
    </BrowserRouter>
  );

  describe('AnalyticsProvider and useAnalytics', () => {
    it('should provide analytics client to components', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.track).toBeInstanceOf(Function);
      expect(result.current.pageViewed).toBeInstanceOf(Function);
      expect(result.current.identify).toBeInstanceOf(Function);
      expect(result.current.setConsent).toBeInstanceOf(Function);
    });

    it('should allow tracking events', async () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      // Track an event
      result.current.track('web.link_clicked', {
        link_url: 'https://example.com',
        link_text: 'Test Link',
      });

      // Advance timers to trigger flush (1500ms flush interval)
      jest.advanceTimersByTime(1500);
      await Promise.resolve(); // Let promises resolve

      // Verify the request
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('/analytics/ingest');
      expect(fetchCall[1].method).toBe('POST');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.events).toHaveLength(1);
      expect(body.events[0].type).toBe('track');
      expect(body.events[0].name).toBe('web.link_clicked');
      expect(body.events[0].properties).toEqual({
        link_url: 'https://example.com',
        link_text: 'Test Link',
      });
    });

    it('should batch multiple events', async () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      // Track multiple events
      result.current.track('web.link_clicked', {
        link_url: 'https://example.com',
      });
      result.current.track('web.link_clicked', {
        link_url: 'https://example2.com',
      });
      result.current.track('web.link_clicked', {
        link_url: 'https://example3.com',
      });

      // Advance timers to trigger flush
      jest.advanceTimersByTime(1500);
      await Promise.resolve();

      expect(global.fetch).toHaveBeenCalled();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.events).toHaveLength(3);
    });

    it('should respect consent settings', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      // Disable analytics
      result.current.setConsent({ analytics: false });

      // Try to track an event
      result.current.track('web.link_clicked', {
        link_url: 'https://example.com',
      });

      // Advance timers
      jest.advanceTimersByTime(1500);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should include session ID in events', async () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.track('web.link_clicked', {
        link_url: 'https://example.com',
      });

      jest.advanceTimersByTime(1500);
      await Promise.resolve();

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      const event = body.events[0];

      expect(event.actor.anonymousId).toBeDefined();
      expect(event.actor.anonymousId).toMatch(/^[0-9a-f-]+$/);
      expect(event.context.sessionId).toBe(event.actor.anonymousId);
    });

    it('should include source metadata in events', async () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.track('web.link_clicked', {
        link_url: 'https://example.com',
      });

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      const event = body.events[0];

      expect(event.source).toEqual({
        appId: 'react-app-shell',
        platform: 'web',
        environment: 'test',
        appVersion: '1.0.0',
      });
    });

    it('should handle identify events', async () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.identify({
        user_id: 'user-123',
        email: 'test@example.com',
      });

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.events[0].type).toBe('identify');
      expect(body.events[0].traits).toEqual({
        user_id: 'user-123',
        email: 'test@example.com',
      });
    });
  });

  describe('Page View Tracking', () => {
    it('should track session start on first render', async () => {
      // Set up initial URL with UTM params
      delete (window as any).location;
      (window as any).location = new URL(
        'http://localhost/?utm_source=google&utm_campaign=test'
      );

      const TestComponent = () => {
        useShellPageViews();
        return null;
      };

      const TestWrapper = ({ children }: { children: ReactNode }) => (
        <BrowserRouter>
          <AnalyticsProvider>
            <Routes>
              <Route path="/" element={<TestComponent />} />
            </Routes>
            {children}
          </AnalyticsProvider>
        </BrowserRouter>
      );

      renderHook(() => null, { wrapper: TestWrapper });

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      const sessionEvent = body.events.find(
        (e: any) => e.name === 'web.session_started'
      );

      expect(sessionEvent).toBeDefined();
      expect(sessionEvent.properties.utm_source).toBe('google');
      expect(sessionEvent.properties.utm_campaign).toBe('test');
      expect(sessionEvent.properties.landing_path).toBe('/');
    });

    it('should track page views with correct structure', async () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      // Manually trigger a page view
      result.current.pageViewed({
        toPath: '/products',
        fromPath: '/home',
        title: 'Products',
      });

      // Advance timers to trigger flush
      jest.advanceTimersByTime(1500);
      await Promise.resolve();

      expect(global.fetch).toHaveBeenCalled();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      const pageEvent = body.events.find((e: any) => e.type === 'page');

      expect(pageEvent).toBeDefined();
      expect(pageEvent.name).toBe('web.page_viewed');
      expect(pageEvent.properties.to_path).toBe('/products');
      expect(pageEvent.properties.from_path).toBe('/home');
      expect(pageEvent.properties.nav_type).toBe('client_route');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAnalytics(), { wrapper });

      // This should not throw
      expect(() => {
        result.current.track('web.link_clicked', {
          link_url: 'https://example.com',
        });
      }).not.toThrow();

      // Advance timers to trigger flush
      jest.advanceTimersByTime(1500);
      await Promise.resolve();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should reject invalid event names', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      // Track with invalid event name
      result.current.track('invalid.event' as any, {});

      // Advance timers
      jest.advanceTimersByTime(1500);

      // Should not have sent anything
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should reject invalid property keys', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      // Track with camelCase property (should be snake_case)
      result.current.track('web.link_clicked', {
        linkUrl: 'https://example.com', // Invalid: should be link_url
      } as any);

      // Advance timers
      jest.advanceTimersByTime(1500);

      // Should not have sent anything
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
