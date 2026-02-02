/**
 * Analytics React Context
 *
 * Provides analytics client to the entire app via React Context.
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useMemo, ReactNode } from 'react';
import type { AnalyticsClient, Source } from './types';
import { AnalyticsClientImpl } from './client';
import { getOrCreateSessionId } from './session';
import { getEnv } from '@/lib/env-provider';

/**
 * Analytics Context
 */
export const AnalyticsContext = createContext<AnalyticsClient | null>(null);

/**
 * Analytics Provider Props
 */
export interface AnalyticsProviderProps {
  children: ReactNode;
  /**
   * Function to get the current user ID (from auth store)
   * Returns undefined if not authenticated
   */
  getUserId?: () => string | undefined;
  /**
   * Override ingest URL (defaults to env var or /analytics/ingest)
   */
  ingestUrl?: string;
  /**
   * Override source configuration
   */
  source?: Partial<Source>;
}

/**
 * Default source configuration
 */
const DEFAULT_SOURCE: Source = {
  appId: 'react-app-shell',
  platform: 'web',
  environment: (import.meta.env.MODE as 'dev' | 'staging' | 'prod') || 'dev',
  appVersion: '1.0.0', // TODO: Read from package.json or env var
};

/**
 * Analytics Provider
 *
 * Wraps the app and provides analytics client to all components.
 *
 * @example
 * ```tsx
 * <AnalyticsProvider getUserId={() => authStore.userId}>
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({
  children,
  getUserId = () => undefined,
  ingestUrl,
  source: sourceOverride,
}: AnalyticsProviderProps) {
  // Create analytics client (singleton per provider instance)
  const client = useMemo(() => {
    // Get or create session ID
    const sessionId = getOrCreateSessionId();

    // Determine ingest URL
    const finalIngestUrl =
      ingestUrl || getEnv('ANALYTICS_INGEST_URL') || '/analytics/ingest';

    // Merge source configuration
    const source: Source = {
      ...DEFAULT_SOURCE,
      ...sourceOverride,
    };

    // Create client
    return new AnalyticsClientImpl(
      {
        source,
        ingestUrl: finalIngestUrl,
        getUserId,
      },
      sessionId
    );
  }, [getUserId, ingestUrl, sourceOverride]);

  return (
    <AnalyticsContext.Provider value={client}>
      {children}
    </AnalyticsContext.Provider>
  );
}
