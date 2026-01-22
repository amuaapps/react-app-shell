# React App Shell

A modern React application shell following MACH principles and Amua Apps coding standards.

## Overview

This repository provides a foundational React app structure with:
- TypeScript support
- Static Site Generation (SSG) for unauthenticated traffic
- Micro-frontend architecture (host shell for remote apps)
- Multi-cloud infrastructure support (Azure & AWS)
- Automated CI/CD via GitHub Actions

## Purpose

The shell is responsible for:
- Rendering **TopNavigation** and **Footer** from `@amuaapps/ui-library`
- Applying styling/tokens from `@amuaapps/ui-theme-core`
- Owning top-level **routing**
- Mounting remote React apps (microfrontends):
  - `/campaigns/**` → `react-app-campaigns` (remote app)
  - `/**` (all other routes) → `react-app-core` (remote app)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- GitHub Personal Access Token (PAT) with `read:packages` scope

### GitHub Packages Authentication

This project consumes private packages from GitHub Packages:
- `@amuaapps/ui-library`
- `@amuaapps/ui-theme-core`

#### Local Development Setup

1. **Create a GitHub Personal Access Token (PAT)**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with `read:packages` scope
   - Copy the token (you won't be able to see it again)

2. **Configure npm authentication**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   export NPM_PACKAGE_TOKEN=your_github_token_here
   npm install
   ```

   **Option B: Local .npmrc file**
   ```bash
   echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE" > .npmrc.local
   npm install
   ```
   Note: `.npmrc.local` is gitignored and will never be committed.

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

#### CI/CD Authentication

In GitHub Actions, authentication is handled automatically using the `NPM_PACKAGE_TOKEN` repository secret:

```yaml
- name: Install dependencies
  run: npm ci
  env:
    NPM_PACKAGE_TOKEN: ${{ secrets.NPM_PACKAGE_TOKEN }}
```

**Setting up the repository secret:**
1. Go to repository Settings → Secrets and variables → Actions
2. Create a new repository secret named `NPM_PACKAGE_TOKEN`
3. Use a GitHub PAT with `read:packages` scope as the value

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code (CI-blocking)
- `npm run lint:fix` - Fix linting issues
- `npm run typecheck` - Type check (CI-blocking)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting (CI-blocking)
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Troubleshooting

#### Authentication Issues

**Problem: `npm install` fails with 401 Unauthorized**

Solution:
1. Verify your GitHub token has `read:packages` scope
2. Ensure the token is properly set:
   ```bash
   echo $NPM_PACKAGE_TOKEN  # Should output your token
   ```
3. If using `.npmrc.local`, verify the file exists and contains your token
4. Try clearing npm cache: `npm cache clean --force`

**Problem: Cannot find package `@amuaapps/ui-library`**

Solution:
1. Verify the package exists in GitHub Packages
2. Check that `.npmrc` contains the correct registry configuration
3. Ensure you have access to the `amuaapps` organization packages

**Problem: CI/CD pipeline fails with authentication error**

Solution:
1. Verify `NPM_PACKAGE_TOKEN` secret is set in repository settings
2. Ensure the token used in the secret has `read:packages` scope
3. Check that the workflow file passes the secret as an environment variable

## Documentation

### Required UI & Brand Contracts

This repository follows strict UI and brand contracts. Before making any UI changes, consult:

- **[Brand Contract](./docs/brand-contract.md)** — Brand identity, theming, and token-first branding rules
- **[UI Contract](./docs/ui-contract.md)** — Component composition, spacing, accessibility, and styling rules
- **[Design Tokens](./docs/design-tokens.md)** — Token architecture, semantic tokens, and compliance rules

### Standards

- **[Coding Standards](./docs/agents.md)** — Complete coding standards and OSS setup for Amua Apps

See the [docs](./docs) directory for all documentation.
