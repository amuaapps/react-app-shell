/**
 * Event validation utilities
 *
 * Validates event names and properties against the SKU registry.
 * When @wvi/analytics-sku is available, use its validation functions instead.
 */

import type { AllowedEventName } from './types';

/**
 * Check if we're in development mode (works in both Vite and Jest)
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * All allowed event names (from SKU registry)
 */
const ALLOWED_EVENT_NAMES: Set<AllowedEventName> = new Set([
  'web.session_started',
  'web.page_viewed',
  'web.link_clicked',
  'web.form_submitted',
  'web.error_occurred',
  'app.feature_used',
  'app.action_completed',
]);

/**
 * Validate that an event name is in the SKU registry
 *
 * @param name - Event name to validate
 * @returns true if valid, false otherwise
 */
export function validateEventName(name: string): name is AllowedEventName {
  return ALLOWED_EVENT_NAMES.has(name as AllowedEventName);
}

/**
 * Check if a string is in snake_case
 */
function isSnakeCase(str: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(str);
}

/**
 * Validate that all property keys are in snake_case
 *
 * @param properties - Properties object to validate
 * @returns Object with validation result and invalid keys
 */
export function validatePropertyCasing(properties: Record<string, unknown>): {
  valid: boolean;
  invalidKeys: string[];
} {
  const invalidKeys: string[] = [];

  for (const key of Object.keys(properties)) {
    if (!isSnakeCase(key)) {
      invalidKeys.push(key);
    }
  }

  return {
    valid: invalidKeys.length === 0,
    invalidKeys,
  };
}

/**
 * Validate event properties against SKU schema
 *
 * In production, this should use the JSON schema validator from @wvi/analytics-sku.
 * For now, we just validate casing and basic type checks.
 *
 * @param name - Event name
 * @param properties - Properties to validate
 * @returns Object with validation result and errors
 */
export function validateProperties(
  name: AllowedEventName,
  properties: Record<string, unknown>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate property key casing
  const casingResult = validatePropertyCasing(properties);
  if (!casingResult.valid) {
    errors.push(
      `Invalid property keys (must be snake_case): ${casingResult.invalidKeys.join(', ')}`
    );
  }

  // Basic required field validation for known events
  if (name === 'web.page_viewed') {
    if (!properties.to_path) {
      errors.push('Missing required property: to_path');
    }
    if (!properties.nav_type) {
      errors.push('Missing required property: nav_type');
    }
  }

  if (name === 'web.session_started') {
    if (!properties.landing_path) {
      errors.push('Missing required property: landing_path');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an event before building
 * Returns validation result
 */
export function validateEvent(
  eventName: string,
  properties: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate event name
  if (!validateEventName(eventName)) {
    const error = `Invalid event name: "${eventName}". Must be one of: ${Array.from(ALLOWED_EVENT_NAMES).join(', ')}`;
    errors.push(error);
    if (isDev) {
      console.error('[Analytics Validation]', error);
    }
    // Return early if event name is invalid
    return { valid: false, errors };
  }

  // Validate properties (eventName is now validated as AllowedEventName)
  const propResult = validateProperties(eventName, properties);
  if (!propResult.valid) {
    errors.push(...propResult.errors);
    if (isDev) {
      console.error('[Analytics Validation]', propResult.errors.join(', '), properties);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
