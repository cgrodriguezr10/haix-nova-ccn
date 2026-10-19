import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        azul:    '#1A3C5E',
        cyan:    '#00B4D8',
        naranja: '#E87C2B',
        bg:      '#0D1B2A',
        surface: '#112236',
        border:  '#1E3A55',
        muted:   '#64748B',
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
