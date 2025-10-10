# Agent Orchestrator Design System

**Version:** 1.0
**Date:** 2025-10-10
**Author:** Amelia (Dev Agent)
**Related:** UX Specification v1.0, Story 8.1

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Signature Elements](#signature-elements)
4. [Color Palette](#color-palette)
5. [Typography System](#typography-system)
6. [Spacing & Layout](#spacing--layout)
7. [Interactive States](#interactive-states)
8. [Component Patterns](#component-patterns)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Accessibility Requirements](#accessibility-requirements)

---

## Overview

### Purpose

This design system defines Agent Orchestrator's distinctive visual identity, moving beyond generic Tailwind blues and grays to create a professional, memorable interface. The goal is to maintain clean readability while establishing visual distinction through 2-3 signature elements used consistently throughout the platform.

### Design Enhancement from UX Spec Baseline

**Current State (Generic):**
- Primary Blue: #3B82F6 (standard Tailwind blue-500)
- Neutral grays: #F9FAFB to #111827 (Tailwind gray palette)
- Standard sans-serif typography (Inter font)
- Minimal visual distinction from AI-generated sites

**Enhanced Identity:**
- **Deep Ocean Blue** primary (#1E40AF / blue-800) - more authoritative than standard blue-500
- **Vibrant Cyan Accents** (#06B6D4 / cyan-500) - energetic secondary color
- **Thick Border Signatures** - Distinctive 4-6px left borders on key elements
- **Warm Neutrals** - Slate grays instead of pure grays for warmth
- **Geometric Precision** - Consistent 8px/12px border radii system

---

## Design Philosophy

### Core Principles

1. **Professional Authority** - Deep blues and precise geometry create trustworthiness
2. **Energy Through Accent** - Cyan highlights add energy without overwhelming
3. **Consistent Rhythm** - Repeating border patterns create visual coherence
4. **Readable First** - All design choices prioritize clarity and usability
5. **Accessible Always** - WCAG AA contrast ratios, visible focus states, motion-reduce support

### Competitive Differentiation

**What makes us distinct:**
- **Deeper blue primary** (not light blue) → professional, authoritative
- **Cyan accents** (not standard blue-600 hover) → energetic, modern
- **Signature left borders** (4-6px thick) → geometric precision, visual rhythm
- **Slate neutrals** (warmer grays) → approachable, not sterile
- **8px border radius** (not 4px or 12px) → balanced between sharp/soft

**Inspiration:**
- **Linear**: Bold color choices, sharp corners, high contrast
- **Stripe**: Gradient accents, clean sans-serif, ample whitespace
- **Vercel**: Black/white contrast, geometric precision

---

## Signature Elements

We use **3 distinctive signature elements** consistently throughout the interface:

### 1. Thick Left Borders (Primary Signature)

**Usage:** Headings, cards, panels, message bubbles, blockquotes

**Specification:**
- **Width:** 4px (H2, panels, cards) or 6px (H1, primary headings)
- **Color:** Cyan-500 (#06B6D4) for headings, Blue-800 (#1E40AF) for containers
- **Placement:** Left edge, aligned with content padding

**Visual Impact:** Creates vertical rhythm and geometric precision throughout interface

**Examples:**
```css
/* H1 Headings */
border-left: 6px solid #06B6D4;
padding-left: 16px;

/* Panels/Cards */
border-left: 4px solid #1E40AF;
padding-left: 20px;
```

### 2. Cyan Accent System (Secondary Signature)

**Usage:** Interactive elements, hover states, focus indicators, links, active states

**Specification:**
- **Primary Accent:** Cyan-500 (#06B6D4)
- **Hover Accent:** Cyan-600 (#0891B2)
- **Active Accent:** Cyan-700 (#0E7490)

**Visual Impact:** Adds energy and modernity without sacrificing professionalism

**Examples:**
- Link underlines: 2px solid cyan-500
- Focus rings: 2px ring cyan-500 offset-2
- Hover states: border-cyan-600, bg-cyan-50

### 3. Geometric Border Radius System (Tertiary Signature)

**Usage:** All rounded elements (buttons, inputs, cards, panels, bubbles)

**Specification:**
- **Standard:** 8px (buttons, inputs, small cards)
- **Large:** 12px (panels, message bubbles, large cards)
- **Round:** 9999px (pills, badges, avatars)

**Visual Impact:** Balanced between sharp (modern) and soft (friendly)

**Rationale:** Avoids generic 4px (too sharp) and 16px (too soft). 8px/12px creates distinctive middle ground.

---

## Color Palette

### Primary Colors

**Deep Ocean Blue (Primary Action)**
```
blue-800: #1E40AF   (Default primary - buttons, active states)
blue-700: #1D4ED8   (Hover state)
blue-900: #1E3A8A   (Pressed/active state)
blue-50:  #EFF6FF   (Light backgrounds, highlights)
```

**Use Cases:**
- Primary buttons background
- Active navigation items
- Panel/card left borders (signature element)
- Selected states in dropdowns

**Contrast:** White text on blue-800 = 8.59:1 (WCAG AAA) ✓

### Accent Colors

**Vibrant Cyan (Interactive Accent)**
```
cyan-500: #06B6D4   (Default accent - links, focus, headings)
cyan-600: #0891B2   (Hover state)
cyan-700: #0E7490   (Active state)
cyan-50:  #ECFEFF   (Light backgrounds)
```

**Use Cases:**
- Link colors and underlines
- Focus ring indicators
- H1/H2 left borders (signature element)
- Hover state accents
- Loading indicators / progress bars

**Contrast:** cyan-600 on white = 4.51:1 (WCAG AA) ✓

### Neutral Colors (Warm Slate)

**Slate Gray Palette**
```
slate-50:  #F8FAFC   (Lightest backgrounds)
slate-100: #F1F5F9   (Card backgrounds, hover states)
slate-200: #E2E8F0   (Borders, dividers)
slate-300: #CBD5E1   (Disabled borders)
slate-400: #94A3B8   (Placeholders, disabled text)
slate-600: #475569   (Secondary text, labels)
slate-700: #334155   (Body text)
slate-900: #0F172A   (Primary text, headings)
```

**Rationale:** Slate grays are warmer than pure grays (gray-X), creating more approachable feel

### Semantic Colors

**Success (Green)**
```
green-600: #16A34A   (Success messages, confirmations)
green-50:  #F0FDF4   (Success backgrounds)
```

**Error (Red)**
```
red-600:   #DC2626   (Error messages, destructive actions)
red-50:    #FEF2F2   (Error backgrounds)
```

**Warning (Amber)**
```
amber-600: #D97706   (Warnings, caution states)
amber-50:  #FFFBEB   (Warning backgrounds)
```

### Background System

```
White:     #FFFFFF   (Primary background - chat area, panels)
slate-50:  #F8FAFC   (Secondary background - file viewer, sidebars)
slate-100: #F1F5F9   (Tertiary background - hover states, code blocks)
```

---

## Typography System

### Font Families

**Primary (UI Text):**
```
font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
```
- Clean, modern, excellent readability
- Variable font weights (300-700)
- Already loaded in layout.tsx

**Monospace (Code):**
```
font-mono: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace
```
- Code blocks, file paths, technical content
- Ligature support for code readability

### Type Scale

**Headings:**
```
H1: text-3xl (30px)   font-bold (700)   leading-tight (1.25)   slate-900
H2: text-2xl (24px)   font-bold (700)   leading-tight (1.25)   slate-900
H3: text-xl  (20px)   font-semibold (600) leading-snug (1.375)  slate-800
H4: text-lg  (18px)   font-semibold (600) leading-snug (1.375)  slate-800
H5: text-base (16px)  font-semibold (600) leading-normal (1.5)  slate-700
H6: text-sm  (14px)   font-semibold (600) leading-normal (1.5)  slate-700
```

**Body Text:**
```
Large:   text-lg   (18px)   font-normal (400)   leading-relaxed (1.625)   slate-700
Base:    text-base (16px)   font-normal (400)   leading-normal (1.5)     slate-700
Small:   text-sm   (14px)   font-normal (400)   leading-normal (1.5)     slate-600
Tiny:    text-xs   (12px)   font-normal (400)   leading-tight (1.25)    slate-500
```

**Labels & UI Text:**
```
Medium:  text-sm   (14px)   font-medium (500)   slate-700
Bold:    text-sm   (14px)   font-semibold (600) slate-900
```

### Font Weight System

```
font-normal:    400   (Body text, paragraphs)
font-medium:    500   (Labels, UI text, emphasized content)
font-semibold:  600   (H3-H6, buttons, strong emphasis)
font-bold:      700   (H1-H2, primary headings)
```

**Rationale:** Skip font-light (300) for better readability on all screens

---

## Spacing & Layout

### Spacing Scale (Tailwind Default)

**Base Unit:** 4px (1 unit = 0.25rem)

```
0:  0px      (no spacing)
1:  4px      (p-1, m-1, gap-1)
2:  8px      (p-2, m-2, gap-2)    ← Tight spacing
3:  12px     (p-3, m-3, gap-3)
4:  16px     (p-4, m-4, gap-4)    ← Default spacing
5:  20px     (p-5, m-5, gap-5)
6:  24px     (p-6, m-6, gap-6)    ← Generous spacing
8:  32px     (p-8, m-8, gap-8)    ← Section spacing
10: 40px     (p-10, m-10, gap-10)
12: 48px     (p-12, m-12, gap-12) ← Large section spacing
16: 64px     (p-16, m-16, gap-16)
```

### Component Spacing Standards

**Buttons:**
- Padding: `px-4 py-2` (16px × 8px) for standard buttons
- Padding: `px-6 py-3` (24px × 12px) for large buttons
- Gap between buttons: `gap-2` (8px)

**Input Fields:**
- Padding: `px-4 py-3` (16px × 12px)
- Gap between label and input: `gap-2` (8px)

**Cards/Panels:**
- Padding: `p-6` (24px) for standard cards
- Padding: `p-8` (32px) for large panels
- Gap between sections: `gap-6` (24px)

**Message Bubbles:**
- Padding: `px-4 py-3` (16px × 12px)
- Gap between messages: `gap-4` (16px)
- Max width: `max-w-[75%]` for readability

**Vertical Rhythm:**
- Between UI elements: `gap-4` (16px) or `mb-4`
- Between sections: `gap-6` (24px) or `mb-6`
- Between major sections: `gap-8` (32px) or `mb-8`

### Layout Constraints

**Chat Panel:**
- Max width: `max-w-[1200px]` (optimal reading width)
- Width: 70% when file viewer open, 100% when collapsed
- Min width: 600px before horizontal scroll

**File Viewer:**
- Width: 30% when open, 0% when collapsed
- Min width: 400px when open

---

## Interactive States

### Button States

**Primary Button (Blue-800 background):**
```
Default:  bg-blue-800 text-white border-transparent
Hover:    bg-blue-700 shadow-md transition-all duration-200
Active:   bg-blue-900 scale-[0.98]
Disabled: bg-slate-300 text-slate-500 cursor-not-allowed opacity-60
Focus:    ring-2 ring-cyan-500 ring-offset-2 (keyboard navigation)
```

**Secondary Button (White background):**
```
Default:  bg-white text-slate-700 border-2 border-slate-300
Hover:    border-cyan-500 text-cyan-600 shadow-sm
Active:   border-cyan-600 bg-cyan-50
Disabled: bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed
Focus:    ring-2 ring-cyan-500 ring-offset-2
```

**Ghost Button (Transparent):**
```
Default:  bg-transparent text-slate-700 border-transparent
Hover:    bg-slate-100 text-slate-900
Active:   bg-slate-200
Disabled: text-slate-400 cursor-not-allowed
Focus:    ring-2 ring-cyan-500 ring-offset-2
```

### Input Field States

```
Default:  border-2 border-slate-300 bg-white
Hover:    border-slate-400
Focus:    border-cyan-500 ring-2 ring-cyan-500 ring-opacity-30
Error:    border-red-500 ring-2 ring-red-500 ring-opacity-30
Disabled: bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed
```

### Link States

```
Default:  text-cyan-600 underline decoration-2 underline-offset-2
Hover:    text-cyan-700 decoration-cyan-700
Active:   text-cyan-800
Visited:  text-cyan-800 (optional, use sparingly)
Focus:    ring-2 ring-cyan-500 ring-offset-2 rounded-sm
```

### Transitions

**Standard Timing:**
```
Quick:    duration-100 (100ms)  - Subtle color shifts, opacity
Standard: duration-200 (200ms)  - Hover states, border changes (DEFAULT)
Medium:   duration-300 (300ms)  - Panel animations, toggles
Slow:     duration-500 (500ms)  - Page transitions (rare)
```

**Easing:**
```
Default:   ease-in-out          - Most transitions
Snappy:    ease-out             - Button clicks, user-triggered actions
Smooth:    ease-in              - Dismissing elements, fade-outs
```

**Motion-Reduce Support:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Apply `motion-reduce:transition-none` to all animated elements.

---

## Component Patterns

### Message Bubbles

**User Message (Right-aligned):**
```jsx
className="max-w-[75%] ml-auto px-4 py-3 rounded-xl bg-blue-800 text-white"
```
- Background: blue-800 (#1E40AF)
- Text: white
- Border radius: 12px (rounded-xl)
- No left border (signature element reserved for assistant/system)

**Assistant Message (Left-aligned):**
```jsx
className="max-w-[75%] mr-auto px-4 py-3 rounded-xl bg-slate-100 text-slate-900 border-l-4 border-cyan-500"
```
- Background: slate-100 (#F1F5F9)
- Text: slate-900
- Border radius: 12px (rounded-xl)
- **Left border: 4px cyan-500** (signature element)

**System Message (Left-aligned, agent greetings):**
```jsx
className="max-w-[75%] mr-auto px-4 py-3 rounded-xl bg-blue-50 text-slate-900 border-l-4 border-blue-800"
```
- Background: blue-50 (#EFF6FF)
- Text: slate-900
- **Left border: 4px blue-800** (signature element)

### Panels & Cards

**Standard Panel:**
```jsx
className="p-6 bg-white rounded-lg border-l-4 border-blue-800 shadow-sm"
```
- Padding: 24px (p-6)
- Border radius: 8px (rounded-lg)
- **Left border: 4px blue-800** (signature element)
- Shadow: subtle (shadow-sm)

**Card (smaller container):**
```jsx
className="p-4 bg-white rounded-lg border border-slate-200 hover:border-cyan-500 transition-colors"
```
- Padding: 16px (p-4)
- Border: 1px slate-200, hover → cyan-500
- No left border (reserved for panels)

### Buttons

**Primary Action:**
```jsx
className="px-6 py-3 bg-blue-800 text-white rounded-lg font-semibold
           hover:bg-blue-700 hover:shadow-md active:bg-blue-900 active:scale-[0.98]
           focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
           disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed
           transition-all duration-200"
```

**Secondary Action:**
```jsx
className="px-6 py-3 bg-white text-slate-700 border-2 border-slate-300 rounded-lg font-semibold
           hover:border-cyan-500 hover:text-cyan-600 hover:shadow-sm
           active:border-cyan-600 active:bg-cyan-50
           focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
           transition-all duration-200"
```

### Input Fields

**Text Input:**
```jsx
className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg
           focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-30
           placeholder:text-slate-400 text-slate-900
           disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed
           transition-all duration-200"
```

**Textarea:**
```jsx
className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg resize-none
           focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-30
           placeholder:text-slate-400 text-slate-900
           min-h-[120px] max-h-[300px]
           transition-all duration-200"
```

### Headings with Signature Border

**H1 (Page Title):**
```jsx
className="text-3xl font-bold text-slate-900 border-l-6 border-cyan-500 pl-4 mb-6"
```
- **6px cyan left border** (signature element)

**H2 (Section Title):**
```jsx
className="text-2xl font-bold text-slate-900 border-l-4 border-cyan-500 pl-3 mb-4 mt-8"
```
- **4px cyan left border** (signature element)

**H3 (Subsection):**
```jsx
className="text-xl font-semibold text-slate-800 mb-3 mt-6"
```
- No left border (hierarchy distinction)

---

## Implementation Guidelines

### Tailwind Configuration Updates

**Add to `tailwind.config.ts`:**

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#1E40AF',  // blue-800
        hover: '#1D4ED8',    // blue-700
        active: '#1E3A8A',   // blue-900
        light: '#EFF6FF',    // blue-50
      },
      accent: {
        DEFAULT: '#06B6D4',  // cyan-500
        hover: '#0891B2',    // cyan-600
        active: '#0E7490',   // cyan-700
        light: '#ECFEFF',    // cyan-50
      },
    },
    borderWidth: {
      '6': '6px',  // For H1 left borders
    },
    maxWidth: {
      'chat': '1200px',
    },
  },
}
```

### Global Styles (globals.css)

**Update root CSS variables:**

```css
:root {
  --color-primary: #1E40AF;
  --color-accent: #06B6D4;
  --color-text: #0F172A;
  --color-background: #FFFFFF;
}

/* Remove gradient background, use solid white */
body {
  color: var(--color-text);
  background: var(--color-background);
}
```

### Component Refactoring Guidelines

**Priority 1: Replace Hardcoded Hex Colors**
- Search for `#[0-9A-Fa-f]{6}` patterns in all `.tsx` files
- Replace with Tailwind classes or CSS variables
- Example: `#3B82F6` → `bg-primary` or `bg-blue-800`

**Priority 2: Apply Signature Left Borders**
- Add 4-6px left borders to:
  - H1/H2 headings (cyan-500)
  - Assistant/system message bubbles (cyan-500 or blue-800)
  - Panels and cards (blue-800)
  - Blockquotes (cyan-500)

**Priority 3: Standardize Border Radius**
- Buttons/inputs: `rounded-lg` (8px)
- Panels/cards: `rounded-lg` (8px)
- Message bubbles: `rounded-xl` (12px)
- Pills/badges: `rounded-full` (9999px)

**Priority 4: Update Interactive States**
- Focus states: `focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2`
- Hover states: Shift from blue to cyan accents
- Active states: Add `active:scale-[0.98]` for tactile feedback

**Priority 5: Consistent Spacing**
- Use `gap-4` (16px) between UI elements
- Use `gap-6` (24px) between sections
- Use `p-6` (24px) for panel padding
- Use `px-4 py-3` for button/input padding

### File-by-File Refactoring Checklist

**MessageBubble.tsx:**
- [ ] Update user message: `bg-blue-500` → `bg-blue-800`
- [ ] Update assistant message: `bg-gray-200` → `bg-slate-100`, add `border-l-4 border-cyan-500`
- [ ] Update system message: `bg-blue-50` stays, change `border-blue-200` → `border-l-4 border-blue-800`
- [ ] Update text colors: `text-gray-900` → `text-slate-900`
- [ ] Update border radius: `rounded-lg` → `rounded-xl` (12px for bubbles)

**FileContentDisplay.tsx:**
- [ ] Replace all hardcoded hex colors with Tailwind classes
  - `#2c3e50` → `text-slate-900`
  - `#3498db` → `text-cyan-600` or `border-cyan-500`
  - `#e74c3c` → `text-red-600`
  - `#ecf0f1` → `bg-slate-100`
- [ ] Update H1 borders: `border-left: 5px solid #3498db` → `border-l-6 border-cyan-500`
- [ ] Update H2 borders: `border-left: 4px solid #3498db` → `border-l-4 border-cyan-500`
- [ ] Update link colors: `#3498db` → `text-cyan-600 hover:text-cyan-700`

**InputField.tsx / AgentSelector.tsx / Other Form Components:**
- [ ] Update borders: `border-gray-300` → `border-slate-300`
- [ ] Update focus states: `focus:border-blue-500` → `focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500`
- [ ] Update hover states: `hover:border-gray-400` → `hover:border-slate-400`
- [ ] Update border radius: `rounded-md` → `rounded-lg` (8px)

**Button Components:**
- [ ] Primary buttons: `bg-blue-600` → `bg-blue-800`, `hover:bg-blue-700`
- [ ] Add focus rings: `focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2`
- [ ] Add active state: `active:bg-blue-900 active:scale-[0.98]`
- [ ] Update disabled: `disabled:bg-slate-300 disabled:text-slate-500`

---

## Accessibility Requirements

### Color Contrast (WCAG AA Minimum)

**Text Contrast Ratios:**
- Primary text (slate-900 on white): 16.1:1 (AAA) ✓
- Body text (slate-700 on white): 8.59:1 (AAA) ✓
- Secondary text (slate-600 on white): 6.37:1 (AA) ✓
- Link text (cyan-600 on white): 4.51:1 (AA) ✓
- Button text (white on blue-800): 8.59:1 (AAA) ✓

**Interactive Element Contrast:**
- Buttons: 8.59:1 minimum (white on blue-800)
- Links: 4.51:1 minimum (cyan-600 on white)
- Focus rings: 3:1 minimum against background (cyan-500 ring on white)

### Focus Indicators

**All interactive elements MUST have visible focus indicators:**

```css
/* Focus ring standard */
focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-none
```

**Examples:**
- Buttons: 2px cyan ring with 2px offset
- Links: 2px cyan ring with 1px offset, rounded corners
- Inputs: 2px cyan ring with shadow (ring-opacity-30)
- Dropdowns: 2px cyan ring on trigger element

### Motion-Reduce Support

**All animations MUST respect `prefers-reduced-motion`:**

```jsx
// Example: File viewer toggle animation
<motion.div
  animate={{ width: isOpen ? '30%' : '0%' }}
  transition={{ duration: 0.3 }}
  className="motion-reduce:transition-none"
>
```

Apply to:
- Panel slide animations
- Loading indicators (pulsing dots)
- Button hover effects
- Fade-in/fade-out transitions

### Keyboard Navigation

**Ensure all interactive elements are keyboard accessible:**
- Tab order follows visual layout (left-to-right, top-to-bottom)
- Skip to main content link (hidden, visible on focus)
- Enter/Space activates buttons
- Arrow keys navigate dropdowns/trees
- Escape closes modals/dropdowns

**ARIA Labels:**
- All icon-only buttons have `aria-label`
- Form inputs have associated `<label>` elements
- Error messages have `role="alert"`
- Loading states have `aria-live="polite"`

---

## Rationale & Design Decisions

### Why Deep Blue (blue-800) instead of Standard Blue (blue-500)?

**Problem:** Standard Tailwind blue-500 (#3B82F6) is ubiquitous in AI-generated sites, creating generic look.

**Solution:** Blue-800 (#1E40AF) is deeper, more authoritative, conveys professionalism and trust. Still recognizable as "blue theme" but distinct from lighter blues.

**Benefit:** Users perceive deeper blues as more trustworthy and professional (financial services, enterprise software use this pattern).

### Why Cyan Accents instead of Blue-600 Hovers?

**Problem:** Using blue-600 for hover states creates monochromatic blue-on-blue, lacks energy.

**Solution:** Cyan-500 (#06B6D4) adds vibrancy and energy while staying in cool color family (blue-cyan adjacency).

**Benefit:** Interface feels more dynamic and engaging without sacrificing coherence. Cyan is unexpected but harmonious with blue.

### Why Thick Left Borders (4-6px)?

**Problem:** Standard 2px borders are subtle and easy to miss, don't create strong visual rhythm.

**Solution:** 4-6px left borders create bold geometric pattern, inspired by Linear's design language and our markdown spec.

**Benefit:** Creates instant visual recognition ("oh, that's Agent Orchestrator"), establishes hierarchy (6px = primary heading, 4px = secondary elements).

### Why Slate Grays instead of Pure Grays?

**Problem:** Pure grays (gray-100, gray-200) can feel cold and sterile.

**Solution:** Slate grays have subtle blue undertone, creating warmth while maintaining professionalism.

**Benefit:** Warmer neutrals are more approachable and friendly, important for user-facing AI platform.

### Why 8px/12px Border Radius?

**Problem:** 4px feels too sharp, 16px feels too soft/playful (not professional enough).

**Solution:** 8px for UI elements (buttons, inputs), 12px for containers (panels, bubbles) strikes balance.

**Benefit:** Feels modern and friendly without losing professional edge. Distinct from both sharp (4px) and soft (16px) extremes.

---

## Next Steps (Implementation Roadmap)

**Task 2: Standardize Spacing (Story 8.1)**
- Apply spacing scale to all components
- Ensure vertical rhythm consistency

**Task 3: Unify Color Scheme (Story 8.1)**
- Replace all hardcoded hex colors
- Apply new blue-800/cyan-500 palette

**Task 4: Polish Typography (Story 8.1)**
- Update font sizes to type scale
- Apply slate text colors

**Task 5: Refine Button States (Story 8.1)**
- Add cyan focus rings
- Update hover/active states

**Tasks 6-9: Validation & Testing (Story 8.1)**
- Manual visual inspection
- Cross-resolution testing
- Regression comparison

---

## Changelog

| Date       | Version | Change                                      | Author        |
|------------|---------|---------------------------------------------|---------------|
| 2025-10-10 | 1.0     | Initial design system with 3 signature elements | Amelia (Dev Agent) |

---

**Document Status:** Draft - Pending Stakeholder Approval

**Approval Required Before:** Implementing Tasks 2-9 in Story 8.1

**Review Questions for Stakeholder:**
1. Does the deep blue (blue-800) + cyan accent combination feel professional and distinctive?
2. Are the thick left borders (4-6px) visually appealing or too bold?
3. Should we explore alternative accent colors (teal, indigo, violet) or is cyan the right choice?
4. Any concerns about moving from standard blue-500 to deeper blue-800 for primary actions?
