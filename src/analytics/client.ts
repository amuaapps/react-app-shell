/**
 * Analytics client implementation
 *
 * Central analytics client that MFEs use to emit events.
 */

import type {
  AnalyticsClient,
  AllowedEventName,
  PropertiesFor,
  Consent,
  AnalyticsConfig,
  Actor,
} from './types';
import { EventBuilder } from './eventBuilder';
import { AnalyticsTransport } from './transport';
import { collectContext } from './contextCollector';
import {
  getConsent,
  setConsent as updateConsent,
  isAnalyticsEnabled,
} from './consent';

/**
 * Check if we're in development mode (works in both Vite and Jest)
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Analytics client implementation
 */
export class AnalyticsClientImpl implements AnalyticsClient {
  private eventBuilder: EventBuilder;
  private transport: AnalyticsTransport;
  private sessionId: string;
  private getUserId: () => string | undefined;

  constructor(config: AnalyticsConfig, sessionId: string) {
    this.sessionId = sessionId;
    this.getUserId = config.getUserId;

    // Initialize event builder
    this.eventBuilder = new EventBuilder({
      source: config.source,
      getActor: () => this.getActor(),
      getContext: () => collectContext(this.sessionId),
      getConsent: () => getConsent(),
    });

    // Initialize transport
    this.transport = new AnalyticsTransport({
      ingestUrl: config.ingestUrl,
    });
  }

  /**
   * Get current actor (anonymousId + userId)
   */
  private getActor(): Actor {
    return {
      anonymousId: this.sessionId,
      userId: this.getUserId(),
    };
  }

  /**
   * Track a domain event
   */
  track<Name extends AllowedEventName>(
    name: Name,
    properties: PropertiesFor<Name>
  ): void {
    // Check consent
    if (!isAnalyticsEnabled()) {
      if (isDev) {
        console.warn(
          `[Analytics] Event "${name}" not sent (analytics disabled)`
        );
      }
      return;
    }

    // Build event
    const event = this.eventBuilder.buildTrackEvent(
      name,
      properties as Record<string, unknown>
    );

    if (!event) {
      // Validation failed, already logged in dev
      return;
    }

    // Enqueue for sending
    this.transport.enqueue(event);

    if (isDev) {
      console.warn(`[Analytics] Tracked: ${name}`, properties);
    }
  }

  /**
   * Track a page view
   */
  pageViewed(args: {
    toPath: string;
    fromPath?: string | null;
    title?: string;
  }): void {
    // Check consent
    if (!isAnalyticsEnabled()) {
      return;
    }

    // Determine navigation type
    const navType = args.fromPath ? 'client_route' : 'initial_load';

    // Build event
    const event = this.eventBuilder.buildPageEvent({
      to_path: args.toPath,
      from_path: args.fromPath,
      nav_type: navType,
    });

    if (!event) {
      return;
    }

    // Enqueue for sending
    this.transport.enqueue(event);

    if (isDev) {
      console.warn(`[Analytics] Page viewed: ${args.toPath}`);
    }
  }

  /**
   * Identify the current user
   */
  identify(traits?: Record<string, unknown>): void {
    // Check consent
    if (!isAnalyticsEnabled()) {
      return;
    }

    // Build event
    const event = this.eventBuilder.buildIdentifyEvent(traits || {});

    // Enqueue for sending
    this.transport.enqueue(event);

    if (isDev) {
      console.warn('[Analytics] Identify:', traits);
    }
  }

  /**
   * Update consent preferences
   */
  setConsent(consent: Partial<Consent>): void {
    updateConsent(consent);

    if (isDev) {
      console.warn('[Analytics] Consent updated:', consent);
    }
  }
}
