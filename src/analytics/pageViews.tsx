/**
 * Automatic page view tracking
 *
 * Tracks page views and session starts automatically based on route changes.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from './hooks';
import type { SessionStartedProperties } from './types';

/**
 * Parse UTM parameters from URL search params
 */
function parseUtmParams(
  searchParams: URLSearchParams
): Partial<SessionStartedProperties> {
  const utmParams: Partial<SessionStartedProperties> = {};

  const utm_source = searchParams.get('utm_source');
  const utm_medium = searchParams.get('utm_medium');
  const utm_campaign = searchParams.get('utm_campaign');
  const utm_term = searchParams.get('utm_term');
  const utm_content = searchParams.get('utm_content');
  const gclid = searchParams.get('gclid');
  const fbclid = searchParams.get('fbclid');

  if (utm_source) utmParams.utm_source = utm_source;
  if (utm_medium) utmParams.utm_medium = utm_medium;
  if (utm_campaign) utmParams.utm_campaign = utm_campaign;
  if (utm_term) utmParams.utm_term = utm_term;
  if (utm_content) utmParams.utm_content = utm_content;
  if (gclid) utmParams.gclid = gclid;
  if (fbclid) utmParams.fbclid = fbclid;

  return utmParams;
}

/**
 * Get referrer hostname (privacy-minimized)
 */
function getReferrerHost(): string | undefined {
  if (!document.referrer) {
    return undefined;
  }

  try {
    const url = new URL(document.referrer);
    return url.hostname;
  } catch {
    return undefined;
  }
}

/**
 * Hook to automatically track page views and session starts
 *
 * Should be called once at the top level of the app (in App.tsx).
 *
 * Behavior:
 * - On first render: emits web.session_started with UTM params and referrer
 * - On every route change: emits web.page_viewed with from/to paths
 *
 * @example
 * ```tsx
 * function App() {
 *   useShellPageViews();
 *
 *   return <Routes>...</Routes>;
 * }
 * ```
 */
export function useShellPageViews() {
  const location = useLocation();
  const analytics = useAnalytics();
  const previousPathRef = useRef<string | null>(null);
  const sessionStartedRef = useRef(false);

  useEffect(() => {
    // Emit session_started once on first render
    if (!sessionStartedRef.current) {
      sessionStartedRef.current = true;

      // Parse UTM parameters from initial URL
      const searchParams = new URLSearchParams(window.location.search);
      const utmParams = parseUtmParams(searchParams);

      // Get referrer host
      const referrer_host = getReferrerHost();

      // Emit session_started event
      analytics.track('web.session_started@1', {
        ...utmParams,
        landing_path: location.pathname,
        referrer_host,
      });

      if (import.meta.env.DEV) {
        console.warn('[Analytics] Session started', {
          landing_path: location.pathname,
          referrer_host,
          ...utmParams,
        });
      }
    }

    // Emit page_viewed on every route change
    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;

    analytics.pageViewed({
      toPath: currentPath,
      fromPath: previousPath,
      title: document.title,
    });

    // Update previous path for next navigation
    previousPathRef.current = currentPath;
  }, [location.pathname, analytics, location]);
}
