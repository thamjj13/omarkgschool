import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "brand" — deep forest / pine green (primary)
        brand: {
          50: "#eefaf3",
          100: "#d6f2e1",
          200: "#b0e4c8",
          300: "#7ecfa7",
          400: "#4bb282",
          500: "#289766",
          600: "#1a7a51",
          700: "#156142",
          800: "#124d36",
          900: "#0f3f2d",
          950: "#07241a",
        },
        // "accent" — warm gold (secondary / highlights)
        accent: {
          50: "#fdf8ec",
          100: "#f9eccb",
          200: "#f2d793",
          300: "#ecbf5b",
          400: "#e6a932",
          500: "#db8d1d",
          600: "#c16e15",
          700: "#a04f15",
          800: "#833e18",
          900: "#6c3417",
          950: "#3e1a09",
        },
        // "ink" — deep teal-navy for text & dark surfaces
        ink: {
          50: "#f2f7f6",
          100: "#dcebe9",
          200: "#bad7d4",
          300: "#8cbab5",
          400: "#5d9993",
          500: "#437d78",
          600: "#346460",
          700: "#2c514e",
          800: "#274241",
          900: "#0e2321",
          950: "#081715",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(8, 23, 21, 0.15)",
        card: "0 1px 2px rgba(8,23,21,0.06), 0 8px 24px -12px rgba(8,23,21,0.18)",
        glow: "0 0 0 4px rgba(40, 151, 102, 0.15)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.4s ease both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.4s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
