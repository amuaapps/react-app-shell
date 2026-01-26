import React, { Component, ReactNode } from 'react';
import { reportError } from '../lib/error-reporter';

interface RemoteAppErrorBoundaryProps {
  children: ReactNode;
  remoteName: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface RemoteAppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches errors from remote apps
 * Prevents remote app failures from crashing the entire shell
 */
class RemoteAppErrorBoundary extends Component<
  RemoteAppErrorBoundaryProps,
  RemoteAppErrorBoundaryState
> {
  constructor(props: RemoteAppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): RemoteAppErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Report error via abstraction (no-op in production by default)
    reportError(`Error in remote app "${this.props.remoteName}"`, error, {
      remoteName: this.props.remoteName,
      componentStack: errorInfo.componentStack,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="remote-app-error p-8 text-center">
          <div className="max-w-[600px] mx-auto p-6 bg-destructive text-destructive-foreground rounded-[var(--radius)] border border-border">
            <h2 className="mb-4 text-2xl font-semibold">
              Application Error
            </h2>
            <p className="mb-4">
              The <strong>{this.props.remoteName}</strong> application
              encountered an error and could not be loaded.
            </p>
            <p className="mb-4 text-sm">
              {this.state.error?.message || 'An unknown error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-background text-foreground border border-border rounded-[var(--radius)] cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RemoteAppErrorBoundary;
