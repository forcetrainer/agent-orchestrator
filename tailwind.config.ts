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
    },
  },
  plugins: [],
};
export default config;
