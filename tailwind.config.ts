import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        blueink: {
          50: "#f7f8ef",
          100: "#e7ecd3",
          200: "#ccd8a8",
          300: "#aebf78",
          400: "#8fa14f",
          500: "#74863b",
          600: "#5e6d30",
          700: "#4c5928",
          800: "#3e4823",
          900: "#2f381d",
          950: "#1f2613"
        },
        mist: "#eef2e3",
        graphite: "#303528",
        pewter: "#68725d"
      },
      boxShadow: {
        soft: "0 22px 60px rgba(47, 56, 29, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
