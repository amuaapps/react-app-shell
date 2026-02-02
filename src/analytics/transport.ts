/**
 * Analytics transport layer
 *
 * Handles queuing, batching, and sending events to the analytics-service ingest endpoint.
 */

import type {
  IngestEvent,
  IngestBatchEnvelope,
  TransportConfig,
} from './types';

/**
 * Default transport configuration
 */
const DEFAULT_CONFIG: TransportConfig = {
  ingestUrl: '/analytics/ingest',
  batchSize: 10,
  flushIntervalMs: 1500,
  maxRetries: 2,
};

/**
 * Analytics transport class
 */
export class AnalyticsTransport {
  private queue: IngestEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private config: TransportConfig;

  constructor(config: Partial<TransportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupPageHideHandlers();
  }

  /**
   * Enqueue an event and schedule flush
   */
  enqueue(event: IngestEvent): void {
    this.queue.push(event);

    // Flush immediately if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flushNow();
    } else {
      // Schedule flush if not already scheduled
      this.scheduleFlush();
    }
  }

  /**
   * Schedule a flush after the configured interval
   */
  private scheduleFlush(): void {
    if (this.flushTimer !== null) {
      return; // Already scheduled
    }

    this.flushTimer = setTimeout(() => {
      this.flushNow();
    }, this.config.flushIntervalMs);
  }

  /**
   * Flush the queue immediately
   */
  flushNow(): void {
    // Clear scheduled flush
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Nothing to flush
    if (this.queue.length === 0) {
      return;
    }

    // Drain queue
    const events = this.queue.splice(0);

    // Send batch (fire and forget)
    void this.sendBatch(events);
  }

  /**
   * Send a batch of events to the ingest endpoint
   */
  private async sendBatch(events: IngestEvent[]): Promise<void> {
    const batch: IngestBatchEnvelope = {
      schemaVersion: '1.0.0',
      sentAt: new Date().toISOString(),
      events,
    };

    await this.sendWithRetry(batch, this.config.maxRetries);
  }

  /**
   * Send batch with retry logic
   */
  private async sendWithRetry(
    batch: IngestBatchEnvelope,
    retriesLeft: number
  ): Promise<void> {
    try {
      const response = await fetch(this.config.ingestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
        keepalive: true, // Important for pagehide events
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Success
      if (import.meta.env.DEV) {
        console.warn(
          `[Analytics] Sent batch of ${batch.events.length} events to ${this.config.ingestUrl}`
        );
      }
    } catch (error) {
      if (retriesLeft > 0) {
        // Exponential backoff: 250ms, 750ms
        const backoffMs =
          250 * Math.pow(3, this.config.maxRetries - retriesLeft);

        if (import.meta.env.DEV) {
          console.warn(
            `[Analytics] Send failed, retrying in ${backoffMs}ms... (${retriesLeft} retries left)`,
            error
          );
        }

        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.sendWithRetry(batch, retriesLeft - 1);
      } else {
        // Out of retries, drop the batch
        if (import.meta.env.DEV) {
          console.error(
            `[Analytics] Failed to send batch after ${this.config.maxRetries} retries. Dropping ${batch.events.length} events.`,
            error
          );
        }
      }
    }
  }

  /**
   * Setup handlers to flush on page hide
   */
  private setupPageHideHandlers(): void {
    // Flush on pagehide (best effort with keepalive)
    window.addEventListener('pagehide', () => {
      this.flushNow();
    });

    // Flush on visibility change (when tab becomes hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushNow();
      }
    });
  }
}
