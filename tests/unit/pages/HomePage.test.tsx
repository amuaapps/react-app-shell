import { render, screen } from '@testing-library/react';
import HomePage from '@/pages/HomePage';

describe('HomePage', () => {
  it('renders welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText(/Welcome to React App Shell/i)).toBeInTheDocument();
  });

  it('displays information about micro-frontend routes', () => {
    render(<HomePage />);
    expect(screen.getByText(/\/campaigns\/\*\*/i)).toBeInTheDocument();
    expect(screen.getByText(/react-app-campaigns/i)).toBeInTheDocument();
    expect(screen.getByText(/react-app-core/i)).toBeInTheDocument();
  });

  it('mentions ui-library and ui-theme-core', () => {
    render(<HomePage />);
    expect(screen.getByText(/@amuaapps\/ui-library/i)).toBeInTheDocument();
    expect(screen.getByText(/@amuaapps\/ui-theme-core/i)).toBeInTheDocument();
  });
});
