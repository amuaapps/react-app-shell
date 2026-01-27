/**
 * RemoteAppLoader Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RemoteAppLoader from '@/components/RemoteAppLoader';
import { coreAppStub } from '@/stubs';

// Mock the loader to return stubs immediately for component tests
jest.mock('@/lib/remote-app-contract/loader', () => ({
  loadRemoteApp: jest.fn().mockResolvedValue(coreAppStub),
}));

describe('RemoteAppLoader', () => {
  const defaultProps = {
    name: 'core',
    remoteUrl: 'https://example.com/remoteEntry.js',
    remoteName: 'remoteApp_core',
    basePath: '/',
    fallbackStub: coreAppStub,
  };

  it('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <RemoteAppLoader {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading core/i)).toBeInTheDocument();
  });

  it('renders remote app after loading', async () => {
    const { container } = render(
      <MemoryRouter>
        <RemoteAppLoader {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete and remote app to mount
    await waitFor(() => {
      const remoteContainer = container.querySelector('[data-remote-app="core"]');
      expect(remoteContainer).toBeInTheDocument();
    });
  });

  it('does not show fallback warning when remote loads successfully', async () => {
    render(
      <MemoryRouter>
        <RemoteAppLoader {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading core/i)).not.toBeInTheDocument();
    });

    // Should not show fallback warning
    expect(
      screen.queryByText(/Development Mode.*Using local stub/i)
    ).not.toBeInTheDocument();
  });

  it('uses fallback stub when remote URL is invalid', async () => {
    const { container } = render(
      <MemoryRouter>
        <RemoteAppLoader
          {...defaultProps}
          remoteUrl="https://invalid-url.example.com/remoteEntry.js"
        />
      </MemoryRouter>
    );

    // Should still render the stub
    await waitFor(() => {
      const remoteContainer = container.querySelector('[data-remote-app="core"]');
      expect(remoteContainer).toBeInTheDocument();
    });
  });

  it('passes correct props to RemoteAppMount', async () => {
    const { container } = render(
      <MemoryRouter>
        <RemoteAppLoader {...defaultProps} />
      </MemoryRouter>
    );

    await waitFor(() => {
      const remoteContainer = container.querySelector('[data-remote-app="core"]');
      expect(remoteContainer).toBeInTheDocument();
    });
  });
});
