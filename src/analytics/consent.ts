/**
 * Consent management for analytics
 *
 * Manages user consent preferences for analytics, experimentation, and personalization.
 */

import type { Consent } from './types';

/**
 * Default consent state
 * - analytics: true (enabled by default for basic analytics)
 * - experimentation: false (opt-in required)
 * - personalization: false (opt-in required)
 */
const DEFAULT_CONSENT: Consent = {
  analytics: true,
  experimentation: false,
  personalization: false,
  timestamp: new Date().toISOString(),
};

/**
 * In-memory consent store
 */
let currentConsent: Consent = { ...DEFAULT_CONSENT };

/**
 * Get current consent state
 */
export function getConsent(): Consent {
  return { ...currentConsent };
}

/**
 * Update consent preferences
 *
 * @param partial - Partial consent object with fields to update
 */
export function setConsent(partial: Partial<Omit<Consent, 'timestamp'>>): void {
  currentConsent = {
    ...currentConsent,
    ...partial,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Reset consent to default state
 */
export function resetConsent(): void {
  currentConsent = {
    ...DEFAULT_CONSENT,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return currentConsent.analytics;
}
