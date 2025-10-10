import type { Config } from "tailwindcss";

/**
 * Tailwind Configuration
 *
 * Design System (Story 8.1 - docs/design-system.md):
 * - Primary: #1E40AF (blue-800), Hover: #1D4ED8 (blue-700)
 * - Accent: #06B6D4 (cyan-500), Hover: #0891B2 (cyan-600)
 * - Neutrals: Slate grays (warmer than pure grays)
 * - Signature: 4-6px left borders, 8px/12px border radius
 * - Base spacing: 4px increments
 * - Breakpoints: md (768px), lg (1024px), xl (1280px)
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',  // blue-800 - Deep ocean blue
          hover: '#1D4ED8',    // blue-700
          active: '#1E3A8A',   // blue-900
          light: '#EFF6FF',    // blue-50
        },
        accent: {
          DEFAULT: '#06B6D4',  // cyan-500 - Vibrant cyan
          hover: '#0891B2',    // cyan-600
          active: '#0E7490',   // cyan-700
          light: '#ECFEFF',    // cyan-50
        },
      },
      borderWidth: {
        '6': '6px',  // For H1 signature left borders
      },
      maxWidth: {
        'chat': '1200px', // Optimal reading width per architecture
      },
      // Story 3.6: Loading indicator animations
      keyframes: {
        'bounce-dot': {
          '0%, 80%, 100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
          '40%': {
            transform: 'translateY(-4px)',
            opacity: '0.7',
          },
        },
      },
      animation: {
        'bounce-dot': 'bounce-dot 1.4s infinite ease-in-out',
      },
      animationDelay: {
        '0': '0s',
        '200': '0.2s',
        '400': '0.4s',
      },
    },
  },
  plugins: [],
};
export default config;
