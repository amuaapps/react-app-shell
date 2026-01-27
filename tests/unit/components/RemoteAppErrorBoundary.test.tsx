import { render, screen } from '@testing-library/react';
import RemoteAppErrorBoundary from '@/components/RemoteAppErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('RemoteAppErrorBoundary', () => {
  // Suppress console.error for these tests
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error', () => {
    render(
      <RemoteAppErrorBoundary remoteName="test-remote">
        <div>Test content</div>
      </RemoteAppErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <RemoteAppErrorBoundary remoteName="test-remote">
        <ThrowError shouldThrow={true} />
      </RemoteAppErrorBoundary>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/test-remote/i)).toBeInTheDocument();
  });

  it('displays error message in error UI', () => {
    render(
      <RemoteAppErrorBoundary remoteName="test-remote">
        <ThrowError shouldThrow={true} />
      </RemoteAppErrorBoundary>
    );

    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('displays remote name in error UI', () => {
    render(
      <RemoteAppErrorBoundary remoteName="my-custom-remote">
        <ThrowError shouldThrow={true} />
      </RemoteAppErrorBoundary>
    );

    expect(screen.getByText(/my-custom-remote/i)).toBeInTheDocument();
  });

  it('renders retry button in error UI', () => {
    render(
      <RemoteAppErrorBoundary remoteName="test-remote">
        <ThrowError shouldThrow={true} />
      </RemoteAppErrorBoundary>
    );

    expect(
      screen.getByRole('button', { name: /reload page/i })
    ).toBeInTheDocument();
  });

  it('calls window.location.reload when retry button clicked', () => {
    const reloadSpy = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <RemoteAppErrorBoundary remoteName="test-remote">
        <ThrowError shouldThrow={true} />
      </RemoteAppErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /reload page/i });
    reloadButton.click();

    expect(reloadSpy).toHaveBeenCalled();
  });
});
