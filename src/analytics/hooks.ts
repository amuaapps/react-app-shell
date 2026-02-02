/**
 * Analytics hooks
 */

import { useContext } from 'react';
import { AnalyticsContext } from './context';
import type { AnalyticsClient } from './types';

/**
 * Hook to access analytics client
 *
 * @throws Error if used outside AnalyticsProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const analytics = useAnalytics();
 *
 *   const handleClick = () => {
 *     analytics.track('web.link_clicked', {
 *       link_url: '/about',
 *       link_text: 'Learn More',
 *     });
 *   };
 *
 *   return <button onClick={handleClick}>Learn More</button>;
 * }
 * ```
 */
export function useAnalytics(): AnalyticsClient {
  const client = useContext(AnalyticsContext);

  if (!client) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }

  return client;
}
