import type { Config } from "tailwindcss";

/**
 * Tailwind Configuration
 *
 * Design System (per Solution Architecture Section 7.2):
 * - Primary: #3B82F6 (blue-500), Hover: #2563EB (blue-600)
 * - Gray scale: gray-50 to gray-900
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
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
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
