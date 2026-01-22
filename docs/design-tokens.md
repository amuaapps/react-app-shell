# Design Tokens — ui-library (v1.0.0)

**Document version:** v1.0.0  
**Status:** Active  
**Applies to:** `ui-library` token system and consumer integration

---

## 0. Purpose

This document defines the design tokens used by `ui-library` and the rules for how components consume them.

**Non-negotiable:**
- Components MUST NOT introduce hardcoded visual values.
- All visual styling MUST be expressed through tokens, tokenized utilities, or approved scales.

---

## 1. Token architecture

### 1.1 Semantic tokens (preferred)
Semantic tokens describe *meaning*, not raw values.

Examples:
- `color.background`, `color.foreground`
- `color.primary`, `color.primary_foreground`
- `radius.md`
- `space.4`

### 1.2 Implementation tokens (how they are represented)
Implementation uses:
- CSS custom properties for color + semantic values (preferred)
- Tailwind theme mapping to semantic CSS variables (recommended)
- Tailwind scales for spacing/typography/radius where they are centrally defined and documented

Consumers should be able to override the theme by overriding CSS variables.

---

## 2. Token compliance rules (CI-enforced)

The repository must include a **token compliance check** that fails CI if:
- A hardcoded color appears in source (hex/rgb/hsl)
- Tailwind arbitrary values are used for styling (e.g., `bg-[...]`, `p-[...]`, `text-[...]`)
- Inline styles contain numeric or color literals (except CSS variable references)
- New CSS contains raw values that bypass tokens (unless explicitly allowed and documented)

Allowed:
- Tokenized Tailwind utilities from the agreed scales (spacing scale, typography scale, radius scale)
- CSS variables (`var(--...)`) usage

---

## 3. Color tokens (semantic)

### 3.1 Required semantic color token set
The library must provide at least these semantic tokens (names may follow shadcn defaults, but meaning must remain stable):

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--popover-foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--secondary-foreground`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--accent-foreground`
- `--destructive`
- `--destructive-foreground`
- `--border`
- `--input`
- `--ring`

Optional but recommended:
- `--success`, `--success-foreground`
- `--warning`, `--warning-foreground`
- `--info`, `--info-foreground`

### 3.2 Theme variants
At minimum support:
- light theme
- dark theme

Implementation should support toggling via:
- `.dark` class or
- `data-theme="dark"`

---

## 4. Typography tokens

Typography must be expressed via tokens/scales:
- Font families:
  - `font.sans`
  - `font.mono`
- Font sizes and line heights must be consistent and centrally controlled.

Rules:
- Avoid hardcoded `text-[...]` or inline `font-size`.
- Prefer standard typography utilities mapped to tokens.

---

## 5. Spacing tokens

### 5.1 Spacing scale
Spacing must use a centrally defined scale (tokenized).
In Tailwind terms, this means using the standard spacing scale and forbidding arbitrary spacing values.

Rules:
- Allowed: `p-4`, `gap-2`, `space-y-6` (scale-based)
- Forbidden: `p-[14px]`, `gap-[3px]`, `m-[1.3rem]`

### 5.2 Composition guidelines
See `ui-contract.md` for recommended gaps/paddings in composite components.

---

## 6. Radius tokens

Radius must be tokenized.
Recommended approach:
- Use a base `--radius` token and derive `sm/md/lg` from it (shadcn style).

Rules:
- Avoid one-off `rounded-[...]` values.
- Prefer named radius utilities.

---

## 7. Elevation/shadow tokens

Shadows must be tokenized and consistent.
Rules:
- Avoid raw `shadow-[...]` arbitrary values
- Prefer a small, documented set of elevations

---

## 8. Motion tokens

Motion must respect reduced motion:
- Provide tokenized durations and easing
- Avoid hardcoded transition durations when possible

---

## 9. Token documentation process

When introducing a new token:
1) Add it to the token source of truth (CSS variables / theme mapping)
2) Document it in this file with meaning and usage guidance
3) Update token compliance rules/tests if needed
4) If it affects consumers, add release notes and bump version appropriately

---

## 10. Changelog
- **v1.0.0** — Initial token philosophy and required semantic token set + token compliance rules.
