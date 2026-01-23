import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';

describe('Routing Integration', () => {
  it('renders the app with routing context', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('React App Shell')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Welcome to React App Shell/i, level: 2 })).toBeInTheDocument();
  });

  it('displays layout with header and footer', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(container.querySelector('nav')).toBeInTheDocument();
    expect(container.querySelector('.shell-content')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
