import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AnalyticsProvider } from '@/analytics/context';
import App from '@/App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </BrowserRouter>
    );

    // Check that the app shell structure is rendered
    expect(container.querySelector('.app-shell')).toBeInTheDocument();
    expect(container.querySelector('.shell-content')).toBeInTheDocument();
  });

  it('renders TopNavigation component', () => {
    render(
      <BrowserRouter>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </BrowserRouter>
    );
    // TopNavigation renders "React App Shell" text
    expect(screen.getByText('React App Shell')).toBeInTheDocument();
  });

  it('renders main content area for remote apps', () => {
    const { container } = render(
      <BrowserRouter>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </BrowserRouter>
    );

    // Check that main content area exists where remote apps will be mounted
    const mainContent = container.querySelector('.shell-content');
    expect(mainContent).not.toBeNull();
  });
});
