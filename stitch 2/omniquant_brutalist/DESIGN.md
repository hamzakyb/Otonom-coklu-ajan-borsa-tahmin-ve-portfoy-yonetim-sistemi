# Design System Specification: The Hyper-Liquid Quant

## 1. Overview & Creative North Star
The objective of this design system is to transcend the "SaaS Template" aesthetic. In the high-stakes world of financial analytics, users require more than just data; they require a sense of atmospheric authority and surgical precision.

**Creative North Star: "Techno-Precision Editorial"**
This system blends the raw, structural honesty of Brutalism with the ethereal fluidity of high-end Glassmorphism. We treat the interface as a living, breathing organism of data. By utilizing intentional asymmetry, overlapping layers, and a "Deep Space" tonal foundation, we create an environment that feels both indestructible and lightning-fast. We are moving away from rigid grids toward a layout that feels curated—like a premium financial terminal from a near-future reality.

---

## 2. Colors & Atmospheric Depth
Our palette is rooted in the void of `background` (#121315), punctuated by high-frequency accents that signify market momentum.

### The "No-Line" Rule
Standard UI relies on lines to separate ideas. This system prohibits the use of 1px solid borders for sectioning. Structural definition must be achieved through:
*   **Tonal Shifts:** Placing a `surface_container_low` section against a `surface` background.
*   **Vertical Air:** Utilizing the Spacing Scale (e.g., `spacing-16` or `spacing-20`) to let content breathe.
*   **Negative Space:** High-contrast voids that direct the eye more effectively than any stroke could.

### Surface Hierarchy & Nesting
Think of the UI as layers of physical material. 
*   **Base:** `surface` (#121315) – The foundation.
*   **Secondary Sections:** `surface_container_low` – Subtle separation for sidebars.
*   **Active Cards:** `surface_container_high` – Where the data lives.
*   **Floating Elements:** `surface_container_highest` – Reserved for modals and pop-overs.

### The Glass & Gradient Rule
To achieve the "Ultra-modern" directive, apply a `backdrop-filter: blur(20px)` to floating elements. Combine this with a subtle `grain/noise` texture overlay (2% opacity) on the entire background to eliminate the "flat" digital look. Use linear gradients for primary CTAs, transitioning from `primary` to `primary_container` to give buttons a "liquid light" feel.

---

## 3. Typography
We use a dual-typeface system to balance brutalist impact with technical legibility.

*   **Display & Headlines (Space Grotesk):** These are our "voice." The geometric, slightly technical nature of Space Grotesk provides the "Brutalist-Techno" influence. Use `display-lg` for hero metrics to command attention.
*   **Body & Titles (Inter):** Inter is our "engine." It provides the surgical clarity needed for complex financial data. Use `body-md` for standard analytics and `label-sm` for secondary metadata.

**Hierarchy as Identity:** By pairing a `display-md` headline (Space Grotesk) with a significantly smaller `label-md` (Inter) in `on_surface_variant`, we create an editorial rhythm that feels premium and intentional.

---

## 4. Elevation & Depth
Depth is not about "lift"; it is about "presence."

*   **The Layering Principle:** Avoid shadows for static cards. Instead, use a `surface_container_lowest` card on a `surface_container_low` background. This "inverse nesting" creates a recessed look that feels more modern than a traditional drop shadow.
*   **Ambient Shadows:** For floating menus, use a diffused shadow: `box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4)`. The shadow color should be a tinted version of the background to ensure it feels like natural ambient light.
*   **The "Ghost Border" Fallback:** When a border is required for accessibility, use a "Ghost Border": `outline_variant` at 15% opacity. It should be felt, not seen.
*   **Liquid Glow:** On hover, primary elements should emit a soft outer glow using the `primary_container` color with a 20px blur, mimicking the behavior of neon light on a dark surface.

---

## 5. Components

### Cards & Data Containers
*   **Visual Style:** High-contrast surfaces using `surface_container_high`. 
*   **Details:** Apply a soft inner shadow `inset 0 1px 1px rgba(255, 255, 255, 0.05)` to simulate a beveled glass edge.
*   **Spacing:** Never use dividers. Separate data points using `spacing-4` (0.9rem) vertical gaps.

### Buttons
*   **Primary (Bullish):** `primary_container` background, `on_primary_container` text. Subtle `0.25rem` (DEFAULT) roundedness for a sharp, technical feel.
*   **Secondary (Bearish):** `secondary_container` background. Reserved for sell-side actions or critical alerts.
*   **States:** Hovering a button should trigger a "liquid glow" effect, increasing the intensity of the background color.

### Financial Tickers & Chips
*   **Selection Chips:** Use `surface_variant` for inactive states and `primary_container` for active states. 
*   **Action Chips:** 1px "Ghost Border" using `outline_variant` at 20% opacity.

### Input Fields & Data Entry
*   **Base:** `surface_container_lowest`.
*   **Focus:** A 1px `primary` glow on the bottom border only, maintaining the brutalist edge. No full-box focus rings.
*   **Skeleton Loaders:** Use a pulsing gradient from `surface_container` to `surface_container_highest` to maintain the glass effect even during data fetching.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace asymmetry. Offset your headers from the main content grid by a few pixels to create a bespoke feel.
*   **Do** use `on_surface_variant` for non-critical information to maximize the contrast of the `primary` accents.
*   **Do** use the Spacing Scale religiously. Consistent gaps are the difference between "cluttered" and "complex."

### Don’t:
*   **Don't** use 100% white (#FFFFFF). Always use `on_surface` (#e3e2e5) to prevent eye strain in dark mode.
*   **Don't** use solid dividers. If you feel the need for a line, try using a background color shift instead.
*   **Don't** use standard 45-degree corner radii for cards. Keep them sharp (`DEFAULT` 0.25rem) to maintain the brutalist influence.
*   **Don't** overload the "Glass" effect. If every element is transparent, nothing is. Reserve glassmorphism for top-level overlays (modals, navigation bars).