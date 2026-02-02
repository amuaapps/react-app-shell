/**
 * Analytics module public exports
 *
 * This is the main entry point for the analytics system.
 * MFEs should only import from this file.
 */

// React Context
export { AnalyticsProvider } from './context';
export type { AnalyticsProviderProps } from './context';

// Hooks
export { useAnalytics } from './hooks';

// Page view tracking hook
export { useShellPageViews } from './pageViews';

// Types (for MFE TypeScript usage)
export type {
  AnalyticsClient,
  AllowedEventName,
  PropertiesFor,
  Consent,
} from './types';
