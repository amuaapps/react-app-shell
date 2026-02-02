/**
 * Mock analytics module for tests
 */

/* eslint-disable react-refresh/only-export-components */
import { ReactNode } from 'react';
import type { AnalyticsClient } from '../../src/analytics/types';

// Mock analytics client
const mockAnalyticsClient: AnalyticsClient = {
  track: jest.fn(),
  pageViewed: jest.fn(),
  identify: jest.fn(),
  setConsent: jest.fn(),
};

// Mock AnalyticsProvider (pass-through)
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Mock useAnalytics hook
export function useAnalytics(): AnalyticsClient {
  return mockAnalyticsClient;
}

// Mock useShellPageViews hook (no-op)
export function useShellPageViews(): void {
  // No-op in tests
}

// Export types
export type { AnalyticsClient } from '../../src/analytics/types';
