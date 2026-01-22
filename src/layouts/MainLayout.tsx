import { Outlet } from 'react-router-dom';

function MainLayout() {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <nav>
          <h1>React App Shell</h1>
          <p>TopNavigation placeholder (from @amuaapps/ui-library)</p>
        </nav>
      </header>

      <main className="shell-content">
        <Outlet />
      </main>

      <footer className="shell-footer">
        <p>Footer placeholder (from @amuaapps/ui-library)</p>
      </footer>
    </div>
  );
}

export default MainLayout;
