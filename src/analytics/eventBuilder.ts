/**
 * Event builder for analytics-service ingest events
 *
 * Builds events compatible with the analytics-service ingest contract.
 */

import type {
  IngestEvent,
  TrackEvent,
  PageEvent,
  IdentifyEvent,
  AllowedEventName,
  Source,
  Actor,
  Context,
  Consent,
} from './types';
import { validateEvent } from './validation';

/**
 * Generate a UUID v4 for event IDs
 */
function generateEventId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Event builder dependencies
 */
export interface EventBuilderDeps {
  source: Source;
  getActor: () => Actor;
  getContext: () => Context;
  getConsent: () => Consent;
}

/**
 * Event builder class
 */
export class EventBuilder {
  constructor(private deps: EventBuilderDeps) {}

  /**
   * Build a track event
   */
  buildTrackEvent(
    name: AllowedEventName,
    properties: Record<string, unknown>
  ): TrackEvent | null {
    // Validate event
    if (!validateEvent(name, properties)) {
      return null;
    }

    return {
      schemaVersion: '1.0.0',
      eventId: generateEventId(),
      type: 'track',
      occurredAt: new Date().toISOString(),
      name,
      properties,
      source: this.deps.source,
      actor: this.deps.getActor(),
      context: this.deps.getContext(),
      consent: this.deps.getConsent(),
    };
  }

  /**
   * Build a page event
   */
  buildPageEvent(properties: {
    to_path: string;
    from_path?: string | null;
    nav_type:
      | 'initial_load'
      | 'client_route'
      | 'browser_back'
      | 'browser_forward';
  }): PageEvent | null {
    // Validate properties
    if (!validateEvent('web.page_viewed', properties)) {
      return null;
    }

    return {
      schemaVersion: '1.0.0',
      eventId: generateEventId(),
      type: 'page',
      occurredAt: new Date().toISOString(),
      name: 'web.page_viewed',
      properties,
      source: this.deps.source,
      actor: this.deps.getActor(),
      context: this.deps.getContext(),
      consent: this.deps.getConsent(),
    };
  }

  /**
   * Build an identify event
   */
  buildIdentifyEvent(traits: Record<string, unknown>): IdentifyEvent {
    return {
      schemaVersion: '1.0.0',
      eventId: generateEventId(),
      type: 'identify',
      occurredAt: new Date().toISOString(),
      traits,
      source: this.deps.source,
      actor: this.deps.getActor(),
      context: this.deps.getContext(),
      consent: this.deps.getConsent(),
    };
  }

  /**
   * Build any event type
   */
  buildEvent(
    type: 'track' | 'page' | 'identify',
    data: {
      name?: AllowedEventName;
      properties?: Record<string, unknown>;
      traits?: Record<string, unknown>;
    }
  ): IngestEvent | null {
    if (type === 'track' && data.name && data.properties) {
      return this.buildTrackEvent(data.name, data.properties);
    }

    if (type === 'page' && data.properties) {
      return this.buildPageEvent(
        data.properties as {
          to_path: string;
          from_path?: string | null;
          nav_type:
            | 'initial_load'
            | 'client_route'
            | 'browser_back'
            | 'browser_forward';
        }
      );
    }

    if (type === 'identify' && data.traits) {
      return this.buildIdentifyEvent(data.traits);
    }

    return null;
  }
}
