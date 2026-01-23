import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Import theme-core styles FIRST to ensure CSS variables and tokens are available globally
// This provides: color tokens, spacing scale, typography, radius, shadows, etc.
// Light/dark theme toggling can be added later by setting data-theme attribute on <html>
// TEMPORARY: Using local copy until package import issue is resolved
import './styles/theme-core.css';

import App from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
