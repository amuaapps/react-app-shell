# Brand Contract — ui-library (v1.0.0)

**Document version:** v1.0.0  
**Status:** Placeholder / Draft  
**Applies to:** `ui-library` (shadcn/ui-based React component library)

---

## 0. Purpose

This document defines how **brand identity** is represented in the UI library.  
In v1, components remain **out-of-the-box shadcn/ui**, but the repo must include this contract as the future source of truth for:

- Color palette and semantic color meaning
- Typography decisions
- Corner radius and elevation style
- Motion guidelines
- Iconography and imagery rules
- Light/dark theme requirements
- How brands are introduced without breaking consuming apps

---

## 1. Brand Strategy

### 1.1 Token-first branding (non-negotiable)
Brand customization MUST be implemented via **design tokens** (CSS variables / token system), not via per-component hardcoded values.

- Components MUST reference **semantic tokens**, not “brand A blue”.
- Tokens MUST be overrideable per consuming app and per theme.

### 1.2 Brand profiles
A “brand profile” is a named set of token values (e.g., `default`, `brandA`, `brandB`).

In the future, the library will support:
- Multiple brand profiles (optional)
- Theme variants (e.g., light/dark) per profile
- Runtime selection via attribute-based theming, e.g.:
  - `data-brand="default"`
  - `data-theme="dark"`

---

## 2. Branding Surfaces (what can change safely)

### 2.1 Allowed to change via tokens
- Color (backgrounds, foregrounds, borders, accents, semantic status colors)
- Typography scale and font families (within reasonable bounds)
- Radius scale
- Shadows/elevation scale
- Spacing scale (prefer stable defaults; treat as advanced)
- Focus ring style (must remain accessible)

### 2.2 Not allowed to change (without versioned migration plan)
- Component public APIs (props) in a breaking way
- Accessibility behavior (keyboard nav, ARIA contracts)
- Base layout expectations defined by `ui-contract.md`

---

## 3. Brand Inputs & Requirements (placeholder)

### 3.1 Colors
Provide the following brand inputs per theme variant:
- Primary brand color family (main + hover + active)
- Neutral background/foreground scale
- Semantic colors: success, warning, danger, info
- Focus ring color (must meet WCAG contrast)

### 3.2 Typography
Provide:
- Font family tokens (sans/mono)
- Base font size strategy (no major rescaling without migration)
- Heading scale mapping (h1–h6)

### 3.3 Radius & elevation
Provide:
- Corner radius baseline + scale
- Shadow/elevation scale (subtle, consistent)

### 3.4 Motion
Provide:
- Transition duration tokens
- Easing tokens
- Reduced motion support (must respect OS preference)

### 3.5 Iconography
If the library introduces icons later:
- Icon set decision
- Stroke width and sizing rules
- Color usage via tokens

---

## 4. Implementation hooks (placeholder; no code changes required in v1)

When branding work starts, implement it by:
1) Updating token values in the library’s token files (see `design-tokens.md`)
2) Providing a documented override approach for consumers (recommended: CSS variable overrides)
3) Adding visual regression checks and token compliance checks in CI

---

## 5. Change management
- Token additions are allowed in MINOR versions.
- Token removals/renames require MAJOR versions.
- Brand profile changes should be documented with screenshots and migration notes.

---

## 6. Changelog
- **v1.0.0** — Initial placeholder brand contract for future theming and branding work.
