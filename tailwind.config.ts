import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f6f7f4",
          100: "#e8ebe3",
          200: "#d1d7c7",
          300: "#b3bda3",
          400: "#95a180",
          500: "#7a8866",
          600: "#5f6b4f",
          700: "#4b5540",
          800: "#3e4536",
          900: "#353b2f",
        },
        sand: {
          50: "#faf8f5",
          100: "#f2ede5",
          200: "#e4d9ca",
          300: "#d3c0a8",
          400: "#c0a385",
          500: "#b38e6d",
          600: "#a67b5e",
          700: "#8a6450",
          800: "#715245",
          900: "#5c443b",
        },
        ocean: {
          50: "#f0f7fa",
          100: "#d9ecf3",
          200: "#b7dbe8",
          300: "#85c2d7",
          400: "#4da3bf",
          500: "#3388a5",
          600: "#2c6e8b",
          700: "#295a72",
          800: "#284b5f",
          900: "#254051",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
