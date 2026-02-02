/**
 * Tests for analytics context collector
 */

import { collectContext } from '@/analytics/contextCollector';

describe('Analytics Context Collector', () => {
  const mockSessionId = 'test-session-123';

  beforeEach(() => {
    // Reset window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        pathname: '/test-path',
        search: '',
        href: 'http://localhost/test-path',
      },
    });
    Object.defineProperty(document, 'title', {
      writable: true,
      configurable: true,
      value: 'Test Page',
    });
    Object.defineProperty(document, 'referrer', {
      writable: true,
      configurable: true,
      value: '',
    });
  });

  it('should collect basic context', () => {
    const context = collectContext(mockSessionId);

    expect(context.sessionId).toBe(mockSessionId);
    expect(context.page).toBeDefined();
    expect(context.device).toBeDefined();
    expect(context.locale).toBeDefined();
    expect(context.timezone).toBeDefined();
  });

  it('should collect page context with pathname only', () => {
    const context = collectContext(mockSessionId);

    expect(context.page?.path).toBe('/test-path');
    expect(context.page?.title).toBe('Test Page');
  });

  it('should not include query string in page path', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        pathname: '/test-path',
        search: '?utm_source=google&utm_campaign=test',
        href: 'http://localhost/test-path?utm_source=google',
      },
    });

    const context = collectContext(mockSessionId);

    expect(context.page?.path).toBe('/test-path');
    expect(context.page?.path).not.toContain('?');
    expect(context.page?.path).not.toContain('utm_source');
  });

  it('should collect referrer hostname only', () => {
    Object.defineProperty(document, 'referrer', {
      writable: true,
      configurable: true,
      value: 'https://google.com/search?q=test',
    });

    const context = collectContext(mockSessionId);

    expect(context.page?.referrer).toBe('google.com');
  });

  it('should handle missing referrer', () => {
    const context = collectContext(mockSessionId);

    expect(context.page?.referrer).toBeUndefined();
  });

  it('should detect desktop device class', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    const context = collectContext(mockSessionId);

    expect(context.device?.device_class).toBe('desktop');
  });

  it('should detect tablet device class', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });

    const context = collectContext(mockSessionId);

    expect(context.device?.device_class).toBe('tablet');
  });

  it('should detect mobile device class', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const context = collectContext(mockSessionId);

    expect(context.device?.device_class).toBe('mobile');
  });

  it('should collect viewport dimensions', () => {
    const context = collectContext(mockSessionId);

    expect(context.device?.viewport_width).toBe(1920);
    expect(context.device?.viewport_height).toBe(1080);
  });

  it('should collect locale', () => {
    const context = collectContext(mockSessionId);

    expect(context.locale).toBeDefined();
    expect(typeof context.locale).toBe('string');
  });

  it('should collect timezone', () => {
    const context = collectContext(mockSessionId);

    expect(context.timezone).toBeDefined();
    expect(typeof context.timezone).toBe('string');
  });
});
