import { Outlet } from 'react-router-dom';
import { TopNavigation } from '@amuaapps/ui-library';
import { Footer } from '@amuaapps/ui-library';

function MainLayout() {
  return (
    <div className="app-shell">
      <TopNavigation logo={<span>React App Shell</span>} />

      <main className="shell-content">
        <Outlet />
      </main>

      <Footer
        copyrightText={`© ${new Date().getFullYear()} Amua Apps`}
        links={[
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
          { label: 'Contact', href: '/contact' },
        ]}
      />
    </div>
  );
}

export default MainLayout;
