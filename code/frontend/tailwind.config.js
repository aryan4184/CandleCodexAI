/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#27272A",
        input: "#27272A",
        ring: "#2962FF",
        background: "#050505",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#2962FF",
          foreground: "#FFFFFF",
          hover: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#27272A",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FF1744",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#52525B",
          foreground: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#2962FF",
          foreground: "#FFFFFF",
          success: "#00E676",
          warning: "#FFEA00",
          error: "#FF1744",
        },
        popover: {
          DEFAULT: "#0A0A0A",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#0A0A0A",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: "0.125rem",
        md: "0.125rem",
        sm: "0.125rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};