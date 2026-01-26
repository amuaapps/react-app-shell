/**
 * Error reporting abstraction for production code.
 *
 * This is a no-op by default to keep console.* out of production bundles.
 * Can be wired to monitoring/analytics services (e.g., Sentry, DataDog) later.
 *
 * For development debugging, use browser DevTools or a development-only adapter.
 */

export interface ErrorContext {
  [key: string]: unknown;
}

export interface ErrorReporter {
  /**
   * Report an error that occurred in the application.
   * @param message - Human-readable error message
   * @param error - The error object (if available)
   * @param context - Additional context about the error
   */
  reportError(message: string, error?: unknown, context?: ErrorContext): void;

  /**
   * Report a warning or non-critical issue.
   * @param message - Human-readable warning message
   * @param context - Additional context
   */
  reportWarning(message: string, context?: ErrorContext): void;
}

/**
 * No-op error reporter for production.
 * Errors are silently ignored to avoid console pollution.
 */
class NoOpErrorReporter implements ErrorReporter {
  reportError(): void {
    // No-op: errors are not logged in production
  }

  reportWarning(): void {
    // No-op: warnings are not logged in production
  }
}

/**
 * Development error reporter that logs to console.
 * Only used in development mode (excluded from production builds).
 */
class ConsoleErrorReporter implements ErrorReporter {
  reportError(message: string, error?: unknown, context?: ErrorContext): void {
    console.error(message, error, context);
  }

  reportWarning(message: string, context?: ErrorContext): void {
    console.warn(message, context);
  }
}

/**
 * Global error reporter instance.
 * Uses no-op reporter by default (production-safe).
 * In development, can be swapped with ConsoleErrorReporter.
 */
let errorReporter: ErrorReporter = new NoOpErrorReporter();

/**
 * Set the global error reporter implementation.
 * Call this in development mode to enable console logging.
 *
 * @example
 * // In development entry point:
 * if (import.meta.env.DEV) {
 *   setErrorReporter(new ConsoleErrorReporter());
 * }
 */
export function setErrorReporter(reporter: ErrorReporter): void {
  errorReporter = reporter;
}

/**
 * Report an error to the configured error reporter.
 */
export function reportError(
  message: string,
  error?: unknown,
  context?: ErrorContext
): void {
  errorReporter.reportError(message, error, context);
}

/**
 * Report a warning to the configured error reporter.
 */
export function reportWarning(message: string, context?: ErrorContext): void {
  errorReporter.reportWarning(message, context);
}

// Export reporter classes for testing and custom implementations
export { NoOpErrorReporter, ConsoleErrorReporter };
