# Apple Brand Identity Reference

This document serves as the Source of Truth for the "Apple Polish Pass" applied to the Estrategize SaaS platform. It combines the visual identity guidelines extracted directly from Apple's official site.

## 1. Brand Philosophy
The brand exemplifies **functional minimalism**, focusing heavily on human experience, refined typography, and highly controlled spacing.
- **Tone:** Authoritative yet inviting.
- **Aesthetic:** Clean, product-focused, generous whitespace.
- **Key Elements:** High-contrast text clarity, soft "Squircle" geometric shapes, and distinct glassmorphism/blur overlays.

---

## 2. Color System
Apple employs an extremely restrained and highly functional color palette. Features high contrast and accessibility while maintaining softness (avoiding pure black and pure white simultaneously unless absolute contrast is needed).

### Primary Palette (Neutrals)
- **Main Background (Light):** `#ffffff` 
- **Alt Background (Light):** `#f5f5f7` (Secondary sections, grid backgrounds, footers)
- **Primary Text:** `#1d1d1f` (Soft graphite tone, never pure `#000000`)
- **Secondary Text:** `#6e6e73` (Legal disclaimers, footer links, captions)
- **Pro / Dark Mode Focus:** `#000000` (Pure black, used aggressively for "Pro" lines)
- **Elevated/Dark Secondary:** `#161618` to `#1c1c1e` (Used in Pro Dark Mode cards/surfaces)
- **Borders:** Subtle hairline opacity rings (`rgba(255,255,255,0.04)` to `0.08`)

### Accent Palette (Blue)
- **Focus Active (Primary Button):** `#0071e3` 
- **Link Default:** `#0066cc` (Standard text links, chevron arrows)

---

## 3. Typography System
Apple uses a unified, highly optimized typographic system built around its bespoke **San Francisco (SF Pro)** family.

### Font Stacks
- **Primary Font Stack (The Core):** `"SF Pro Text", "SF Pro Icons", "Helvetica Neue", "Helvetica", "Arial", sans-serif`
- **Display Font Stack (Headings > 20px):** `"SF Pro Display", "SF Pro Icons", "Helvetica Neue", "Helvetica", "Arial", sans-serif`

### Type Scale & Formatting
| Type | Font Family | Size | Weight | Line Height | Letter Spacing |
|------|-------------|------|--------|-------------|----------------|
| **Hero Heading** | SF Pro Display | `56px` - `72px` | `600` (Semibold) | Tight (`< 1.2`) | `-0.015em` |
| **Section Heading**| SF Pro Display | `32px` - `48px` | `600` (Semibold) | `1.2` - `1.3` | `-0.015em` |
| **Body Default** | SF Pro Text | `17px` | `400` (Regular) | `1.47059` | `-0.022em` |
| **Caption/Legal** | SF Pro Text | `12px` | `400` (Regular) | `1.33333` | Normal |

### Key Typographic Principles
1. **Margin Flow:** Margins below headings are typically `margin-top: 0.8em`.
2. **Condensation:** Notice the negative `letter-spacing` (`-0.022em` on body text) to produce sharp, tight density.
3. **Weight Restraint:** Avoid `bold` (700) or `black` (900) weights. The highest typical weight is `semibold` (600).

---

## 4. Component Styles

### Buttons
The primary action button relies on a pure pill shape, maximizing visual softness.
- **Background:** `#0071e3` (Focus Active Blue)
- **Text:** `#ffffff`
- **Border-radius:** `980px` (Complete mathematical pill edge - `rounded-full`)
- **Padding:** Typically `8px 16px` for standard layout or `12px 24px` for hero sections.
- **Interactive State:** Buttons should scale down elegantly on press (`active:scale-95`).

### Cards & Squircles
Cards group product offerings or feature highlights.
- **The Squircle Corner:** Usually `18px` to `28px` (`rounded-[24px]`). This creates the signature Apple Continuous Curve.
- **Background:** Alternating with the section (e.g. Card is `#f5f5f7` on `#ffffff` section).
- **Shadows & Depth:** Minimal reliance on depth shadows. Standard depth: `box-shadow: 0 4px 20px rgba(0,0,0,0.1)`.

### Glassmorphism & Overlays
Headers and Bottom Tabs rely on heavy background blurring for native-feel navigation.
- **Blur/Glass:** Use `backdrop-blur-2xl` with a ~70-80% opacity on the primary background color.

---

## 5. Usage in Estrategize SaaS
The implementation of this system in the project lives primarily inside:
- `frontend/src/index.css` (Base color, border, text variables, and Typography stack configuration)
- `frontend/src/components/` (Classes utilizing `rounded-[24px]`, *pill-buttons*, and glass headers).
