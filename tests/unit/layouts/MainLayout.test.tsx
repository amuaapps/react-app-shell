import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

describe('MainLayout', () => {
  it('renders header with placeholder text', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );
    expect(screen.getByText(/TopNavigation placeholder/i)).toBeInTheDocument();
  });

  it('renders footer with placeholder text', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );
    expect(screen.getByText(/Footer placeholder/i)).toBeInTheDocument();
  });

  it('has correct structure with header, main, and footer', () => {
    const { container } = render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );
    expect(container.querySelector('.shell-header')).toBeInTheDocument();
    expect(container.querySelector('.shell-content')).toBeInTheDocument();
    expect(container.querySelector('.shell-footer')).toBeInTheDocument();
  });
});
