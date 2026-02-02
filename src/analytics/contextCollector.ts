/**
 * Privacy-minimized context collector
 *
 * Collects context information for analytics events while respecting user privacy:
 * - NO full URLs (only pathname)
 * - NO query strings
 * - NO user agent strings
 * - Only referrer hostname (not full URL)
 * - Coarse device classification
 */

import type { PageContext, DeviceContext } from './types';

/**
 * Collect privacy-minimized page context
 */
export function collectPageContext(): PageContext {
  const context: PageContext = {
    path: window.location.pathname,
  };

  // Add title if available
  if (document.title) {
    context.title = document.title;
  }

  // Add referrer hostname only (not full URL)
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      context.referrer = referrerUrl.hostname;
    } catch {
      // Invalid referrer URL, skip
    }
  }

  return context;
}

/**
 * Determine device class based on viewport width
 */
function getDeviceClass(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Collect privacy-minimized device context
 */
export function collectDeviceContext(): DeviceContext {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    device_class: getDeviceClass(width),
    viewport_width: width,
    viewport_height: height,
  };
}

/**
 * Get browser locale
 */
export function getLocale(): string {
  return navigator.language || 'en-US';
}

/**
 * Get timezone
 */
export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Collect full context for analytics events
 */
export function collectContext(sessionId: string) {
  return {
    sessionId,
    page: collectPageContext(),
    device: collectDeviceContext(),
    locale: getLocale(),
    timezone: getTimezone(),
  };
}
