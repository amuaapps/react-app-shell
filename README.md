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

Documentation and setup instructions coming soon.

## Documentation

### Required UI & Brand Contracts

This repository follows strict UI and brand contracts. Before making any UI changes, consult:

- **[Brand Contract](./docs/brand-contract.md)** — Brand identity, theming, and token-first branding rules
- **[UI Contract](./docs/ui-contract.md)** — Component composition, spacing, accessibility, and styling rules
- **[Design Tokens](./docs/design-tokens.md)** — Token architecture, semantic tokens, and compliance rules

### Standards

- **[Coding Standards](./docs/agents.md)** — Complete coding standards and OSS setup for Amua Apps

See the [docs](./docs) directory for all documentation.
