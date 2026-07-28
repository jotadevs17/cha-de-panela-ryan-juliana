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
          50: "#f2f7fb",
          100: "#dcebf5",
          200: "#bed9ea",
          300: "#93c0db",
          400: "#5f9ec6",
          500: "#3d82ad",
          600: "#2f688e",
          700: "#2a5674",
          800: "#294960",
          900: "#263d50"
        },
        mist: "#eef2f5",
        graphite: "#29323d",
        pewter: "#64707d"
      },
      boxShadow: {
        soft: "0 22px 60px rgba(38, 61, 80, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
