# UI Contract — ui-library (v1.0.0)

**Document version:** v1.0.0  
**Status:** Active  
**Applies to:** All components shipped by `ui-library`

---

## 0. Purpose

This document defines how UI components are expected to behave and compose together across products.

The goal is:
- Consistent spacing, sizing, and composition rules
- Predictable className/variant patterns
- Token-first styling (no hardcoded values)
- Accessible defaults

---

## 1. Composition principles

### 1.1 No external layout assumptions
Components MUST NOT impose outer layout constraints on their parent.

Rules:
- Do **not** add arbitrary outer margins to primitives.
- Prefer layout spacing to be handled by the caller (parent container).
- If a component needs internal spacing, it must use design tokens / tokenized utilities.

### 1.2 className pass-through
All components MUST:
- accept a `className` prop where appropriate
- merge classes in a predictable order (base → variants → user className)
- allow consumers to extend styling without modifying internals

### 1.3 Variants over custom styling
If a component needs alternative presentations, prefer:
- well-defined variant props (e.g., `variant`, `size`)
- tokenized variant implementations
- documented defaults

Avoid:
- one-off ad-hoc props that encode visual design in API

---

## 2. Spacing & layout contract

### 2.1 Spacing scale
All spacing MUST come from the **design token scale** documented in `design-tokens.md`.

No arbitrary values:
- No `p-[...]`, `m-[...]`, `gap-[...]`
- No inline styles with numeric spacing values

### 2.2 Standard spacing for common compositions
Use the following guidelines when building composite UIs:

- **Inline controls** (button groups, input + button): use a small gap (token scale “sm”)
- **Form rows** (label + field + hint/error): use medium vertical spacing
- **Section stacks** (card sections, page sections): use larger spacing
- **Dialogs/Drawers**: consistent content padding and header/body/footer separation

These are guidelines; exact token names and scales are defined in `design-tokens.md`.

### 2.3 Padding rules (internal)
- Interactive elements (buttons, inputs) must use consistent paddings across sizes.
- Cards/surfaces must use consistent inner padding.
- Dialogs/sheets must maintain consistent inner padding and action spacing.

---

## 3. Color, elevation, and borders

### 3.1 Token-first colors
Components MUST use semantic tokens only (see `design-tokens.md`):
- backgrounds
- foregrounds
- borders
- muted surfaces
- primary/accent surfaces
- destructive states
- focus ring

Hardcoded colors are forbidden:
- no hex
- no rgb/hsl literals
- no arbitrary Tailwind color values

### 3.2 Elevation
Shadows/elevation must use the token scale.
Do not define custom box-shadow values in component files.

### 3.3 Borders & radius
Border widths and radii must use tokenized values and consistent scale.
Avoid per-component special radii unless defined as a token and documented.

---

## 4. Typography

### 4.1 Token-based typography
Typography must be based on tokens:
- font families
- font sizes
- line heights
- font weights

Avoid:
- hardcoded px/rem font sizes in component files
- arbitrary Tailwind values like `text-[...]`

### 4.2 Headings and text hierarchy
Composite components must maintain a clear hierarchy:
- heading → description → content → helper text
Use consistent tokenized typography styles.

---

## 5. Accessibility (a11y) contract

All components MUST meet WCAG AA minimum:
- Semantic markup
- Keyboard navigability and focus management
- Correct ARIA attributes per Radix/shadcn patterns
- Visible focus ring (tokenized)
- Reduced motion support where relevant

---

## 6. State and interaction contract

Components must reflect states consistently:
- default
- hover
- active/pressed
- focus-visible
- disabled
- loading (when applicable)
- validation states (inputs, forms)

All state styling must remain tokenized and avoid one-off values.

---

## 7. What “out-of-the-box shadcn/ui” means in v1
In v1:
- Components may remain identical to shadcn/ui defaults where possible.
- Any divergence must be documented and justified.
- Token compliance rules still apply (no hardcoded values introduced).

---

## 8. Changelog
- **v1.0.0** — Initial UI contract: composition, spacing, token-first rules, accessibility requirements.
