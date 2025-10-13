'use client';

// components/TopBar.tsx
// Story 10.4: Top Navigation Bar with Flint Branding
// Provides consistent branding across the application

import { FlintLogo } from '@/components/branding/FlintLogo';

/**
 * Top navigation bar with Flint logo and branding.
 *
 * Features:
 * - Flint logo with spark icon (from branding system)
 * - Clean white background with subtle border
 * - Consistent with branding demo design
 * - Full-width header spanning sidebar and main content
 *
 * Design System:
 * - Background: bg-white (clean, professional)
 * - Border: border-b border-slate-200 (subtle divider)
 * - Height: h-14 (56px standard header height)
 * - Logo: Small size for compact header
 */

export function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4">
      <FlintLogo size="sm" />
    </header>
  );
}
