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
import { setErrorReporter, ConsoleErrorReporter } from './lib/error-reporter';

// Configure error reporting for development
// In dev: logs to console for debugging remote loading failures
// In prod: remains no-op (no console output)
if (import.meta.env.DEV) {
  setErrorReporter(new ConsoleErrorReporter());
}

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
