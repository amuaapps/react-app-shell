import React, { Component, ReactNode } from 'react';

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
    // Log error for debugging
    console.error(
      `Error in remote app "${this.props.remoteName}":`,
      error,
      errorInfo
    );

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="remote-app-error"
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              padding: 'var(--space-6)',
              backgroundColor: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
          >
            <h2 style={{ marginBottom: 'var(--space-4)' }}>
              Application Error
            </h2>
            <p style={{ marginBottom: 'var(--space-4)' }}>
              The <strong>{this.props.remoteName}</strong> application
              encountered an error and could not be loaded.
            </p>
            <p style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
              {this.state.error?.message || 'An unknown error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
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
