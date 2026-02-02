/**
 * Analytics types for the shell
 *
 * This module defines the core types for the analytics system.
 * When @amuaapps/analytics-sku is available, import AllowedEventName and
 * PropertiesFor from there instead of defining them here.
 */

// ============================================================================
// Event Registry (Mock - replace with @amuaapps/analytics-sku)
// ============================================================================

/**
 * Allowed event names from the SKU registry.
 * In production, this should be imported from @amuaapps/analytics-sku.
 */
export type AllowedEventName =
  | 'web.session_started'
  | 'web.page_viewed'
  | 'web.link_clicked'
  | 'web.form_submitted'
  | 'web.error_occurred'
  | 'app.feature_used'
  | 'app.action_completed';

/**
 * Properties for each event type.
 * In production, this should be imported from @amuaapps/analytics-sku.
 */
export type PropertiesFor<Name extends AllowedEventName> =
  Name extends 'web.session_started'
    ? {
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        utm_term?: string;
        utm_content?: string;
        gclid?: string;
        fbclid?: string;
        landing_path: string;
        referrer_host?: string;
      }
    : Name extends 'web.page_viewed'
      ? {
          from_path?: string | null;
          to_path: string;
          nav_type:
            | 'initial_load'
            | 'client_route'
            | 'browser_back'
            | 'browser_forward';
        }
      : Name extends 'web.link_clicked'
        ? {
            link_url: string;
            link_text?: string;
            link_target?: string;
          }
        : Name extends 'web.form_submitted'
          ? {
              form_id?: string;
              form_name?: string;
              form_type?: string;
            }
          : Name extends 'web.error_occurred'
            ? {
                error_message: string;
                error_code?: string;
                error_stack?: string;
              }
            : Name extends 'app.feature_used'
              ? {
                  feature_name: string;
                  feature_context?: string;
                }
              : Name extends 'app.action_completed'
                ? {
                    action_name: string;
                    action_result?: 'success' | 'failure';
                  }
                : Record<string, unknown>;

// ============================================================================
// Ingest Event Types (analytics-service contract)
// ============================================================================

export interface Source {
  appId: string;
  platform: 'web' | 'mobile' | 'server';
  environment: 'dev' | 'staging' | 'prod';
  appVersion?: string;
}

export interface Actor {
  anonymousId: string;
  userId?: string;
}

export interface PageContext {
  path: string; // pathname only, no query string
  title?: string;
  referrer?: string; // hostname only
}

export interface DeviceContext {
  device_class: 'mobile' | 'tablet' | 'desktop';
  viewport_width: number;
  viewport_height: number;
}

export interface Context {
  sessionId: string;
  page?: PageContext;
  device?: DeviceContext;
  locale?: string;
  timezone?: string;
}

export interface Consent {
  analytics: boolean;
  experimentation: boolean;
  personalization: boolean;
  timestamp: string; // ISO 8601
}

export interface BaseIngestEvent {
  schemaVersion: '1.0.0';
  eventId: string;
  occurredAt: string;
  source: Source;
  actor: Actor;
  context?: Context;
  consent?: Consent;
}

export interface TrackEvent extends BaseIngestEvent {
  type: 'track';
  name: string;
  properties?: Record<string, unknown>;
}

export interface PageEvent extends BaseIngestEvent {
  type: 'page';
  name: string;
  properties?: Record<string, unknown>;
}

export interface IdentifyEvent extends BaseIngestEvent {
  type: 'identify';
  traits?: Record<string, unknown>;
}

export type IngestEvent = TrackEvent | PageEvent | IdentifyEvent;

export interface IngestRequestEnvelope {
  schemaVersion: '1.0.0';
  sentAt: string;
  events: IngestEvent[];
}

// ============================================================================
// Analytics Client Interface
// ============================================================================

/**
 * Analytics client interface exposed to MFEs via React Context
 */
export interface AnalyticsClient {
  /**
   * Track a domain event
   * @param name - Event name from SKU registry (typed union)
   * @param properties - Event properties (typed based on event name)
   */
  track<Name extends AllowedEventName>(
    name: Name,
    properties: PropertiesFor<Name>
  ): void;

  /**
   * Track a page view (called automatically by shell on route changes)
   * @param args - Page view arguments
   */
  pageViewed(args: {
    toPath: string;
    fromPath?: string | null;
    title?: string;
  }): void;

  /**
   * Identify the current user (optional, for authenticated sessions)
   * @param traits - User traits (snake_case)
   */
  identify(traits?: Record<string, unknown>): void;

  /**
   * Update consent preferences
   * @param consent - Partial consent object
   */
  setConsent(consent: Partial<Consent>): void;
}

// ============================================================================
// Internal Types
// ============================================================================

export interface AnalyticsConfig {
  source: Source;
  ingestUrl: string;
  getUserId: () => string | undefined;
}

export interface TransportConfig {
  ingestUrl: string;
  batchSize: number;
  flushIntervalMs: number;
  maxRetries: number;
}

export interface EventBuilderConfig {
  source: Source;
  getActor: () => Actor;
  getContext: () => Context;
  getConsent: () => Consent;
}

// Event-specific property types (snake_case enforced)
export interface SessionStartedProperties {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_path: string;
  referrer_host?: string;
}

// Batch envelope type alias
export type IngestBatchEnvelope = IngestRequestEnvelope;
