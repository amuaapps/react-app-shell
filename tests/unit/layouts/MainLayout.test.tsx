import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

describe('MainLayout', () => {
  it('renders TopNavigation component', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );
    expect(screen.getByText(/React App Shell/i)).toBeInTheDocument();
  });

  it('renders Footer component with copyright', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );
    expect(screen.getByText(/ Amua Apps/i)).toBeInTheDocument();
  });

  it('renders main content area', () => {
    const { container } = render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    expect(container.querySelector('.shell-content')).toBeInTheDocument();
  });
});
