import { render, screen } from '@testing-library/react';
import { MemoryRouter, BrowserRouter } from 'react-router-dom';
import { AnalyticsProvider } from '@/analytics/context';
import App from '@/App';

describe('Routing Integration', () => {
  it('renders the app with routing context', () => {
    render(
      <AnalyticsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AnalyticsProvider>
    );

    // Check that TopNavigation renders
    expect(screen.getByText('React App Shell')).toBeInTheDocument();
  });

  it('renders TopNavigation and Footer in layout', () => {
    render(
      <AnalyticsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AnalyticsProvider>
    );

    expect(screen.getByText('React App Shell')).toBeInTheDocument();
    // Footer copyright text includes current year
    expect(screen.getByText(/ \d{4} Amua Apps/i)).toBeInTheDocument();
  });

  it('navigates to home page by default', async () => {
    render(
      <AnalyticsProvider>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </AnalyticsProvider>
    );

    expect(screen.getByText('React App Shell')).toBeInTheDocument();
    // Footer copyright text includes current year
    expect(screen.getByText(/ \d{4} Amua Apps/i)).toBeInTheDocument();
  });

  it('displays layout with header and footer', () => {
    const { container } = render(
      <BrowserRouter>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </BrowserRouter>
    );

    expect(container.querySelector('nav')).toBeInTheDocument();
    expect(container.querySelector('.shell-content')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
