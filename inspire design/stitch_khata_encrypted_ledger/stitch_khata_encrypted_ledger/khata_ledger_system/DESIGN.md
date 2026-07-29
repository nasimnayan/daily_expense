---
name: Khata Ledger System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#404944'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#4f1f19'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b342d'
  on-tertiary-container: '#ea9e93'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#380d08'
  on-tertiary-fixed-variant: '#6e372f'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 16px
  gutter: 12px
---

## Brand & Style
The design system is engineered for financial clarity, reliability, and cultural resonance. It serves as a digital "Khata" (ledger), prioritizing utility and precision over decorative flair. The brand personality is grounded, authoritative, yet approachable, aimed at users managing sensitive personal or small-business finances.

The design style follows a **Modern Corporate** aesthetic with a **Tactile Minimalist** twist. It utilizes a highly structured grid to handle dense financial data while employing soft, intentional elevation to separate layers of information. The interface is "Bangla-first," ensuring that the script’s unique vertical rhythm dictates the spatial harmony of the layout. Emotional response should be one of "controlled transparency"—users should feel their data is safe, organized, and easily digestible at a glance.

## Colors
The palette is rooted in a deep Forest Green (`primary`), symbolizing growth and financial health, paired with a Slate Navy (`secondary`) for structural elements and text. 

- **Backgrounds**: The core surface uses a soft light-gray (`#F8FAFC`) to prevent the stark eye strain of pure white while maintaining high contrast for text.
- **Semantic Colors**: Emerald is used exclusively for positive cash flow (income/savings). Rose is reserved for outflows (expenses/debt). Amber indicates caution (over-budget/pending).
- **Surface Strategy**: Use white (`#FFFFFF`) for primary content cards to make them "pop" against the soft gray background.

## Typography
The typography system is dual-engine: **Inter** handles the heavy lifting for functional UI and body text due to its exceptional legibility, while **Hanken Grotesk** provides a clean, modern editorial feel for headings. 

For Bangla script support, the system defaults to **Hind Siliguri**. The line-height for Bangla segments must be increased by 20% relative to English to accommodate the matra (top bar) and sub-scripts without crowding. 

**Financial Data**: All monetary values must use **JetBrains Mono**. This tabular, monospaced font ensures that decimal points and digits align vertically in lists, making it easy for users to compare amounts at a glance.

## Layout & Spacing
This design system uses a **Fluid Grid** model optimized for mobile-first ledger entries. The spacing scale is based on a 4px baseline to ensure tight alignment of data rows.

- **Mobile**: A 4-column grid with 16px side margins and 12px gutters.
- **Desktop/Tablet**: A 12-column centered grid with a maximum content width of 1140px. 
- **Rhythm**: Use `spacing-md` (16px) for standard internal card padding. Use `spacing-xs` (8px) for related grouping, such as an icon paired with a label.
- **Touch Targets**: All interactive elements must maintain a minimum height of 44px to ensure accessibility for quick entry on the go.

## Elevation & Depth
Hierarchy is established through **Tonal Layering** and **Ambient Shadows**. 

1.  **Level 0 (Base)**: `#F8FAFC` background. 
2.  **Level 1 (Cards)**: White `#FFFFFF` surfaces with a subtle, 1px border in `#E2E8F0` and a soft, low-opacity shadow (Y: 2px, Blur: 4px, Color: `rgba(15, 23, 42, 0.05)`).
3.  **Level 2 (Active/Modals)**: Higher elevation with a more pronounced shadow (Y: 8px, Blur: 16px, Color: `rgba(15, 23, 42, 0.08)`) to draw focus.

Avoid heavy gradients. Use subtle background tints (e.g., a 5% opacity Forest Green fill) to highlight active states or selected items rather than deep shadows.

## Shapes
The shape language is "Soft Professional." The system uses a 4px (0.25rem) base radius to maintain a sense of precision and structure, avoiding the overly "bubbly" look of consumer social apps. 

- **Primary Radius**: 4px for buttons, input fields, and small tags.
- **Large Radius**: 8px (rounded-lg) for content cards and containers.
- **Extra Large**: 12px (rounded-xl) for bottom sheets and modal overlays.

## Components
- **Buttons**: Primary buttons are solid Forest Green with white text. Secondary buttons use a Slate Navy outline. Ensure the Bangla text is vertically centered—adjusting for the script's descenders.
- **Ledger Cards**: Use a white background with a thin `#E2E8F0` border. Place the transaction name on the left and the monospaced amount on the right. Amounts must be color-coded (Emerald for plus, Rose for minus).
- **Input Fields**: Labeled clearly above the field. Use a 1px border that shifts to Primary Forest Green on focus. Include a "Currency Toggle" (BDT/USD) as a segmented controller within the field area.
- **Bottom Navigation**: Use a persistent bar with a white background and a subtle top border. Icons should be "Outline" style for inactive states and "Solid" Forest Green for the active state.
- **Chips/Badges**: Use highly desaturated versions of status colors (e.g., 10% Emerald background with 100% Emerald text) for transaction categories like "Food" or "Rent."
- **Empty States**: Use simple, mono-line illustrations with clear calls to action (e.g., "Add your first transaction").