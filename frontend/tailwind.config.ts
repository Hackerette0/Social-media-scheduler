import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        accent:  ["'Bebas Neue'", "Impact", "sans-serif"],
        body:    ["'Raleway'", "system-ui", "sans-serif"],
        type:    ["'Courier Prime'", "'Courier New'", "monospace"],
        elegant: ["'Cormorant Garamond'", "Georgia", "serif"],
      },
      colors: {
        cream:   "#fdf6ee",
        blush: {
          DEFAULT: "#f4e6d8",
          dark:    "#e8c9b4",
        },
        rose:    "#c9846a",
        forest: {
          DEFAULT: "#253020",
          mid:     "#3a4a34",
          light:   "#5a6e52",
        },
        sage: {
          DEFAULT: "#7d9070",
          light:   "#b3c4a8",
        },
        ink: {
          DEFAULT: "#1a1208",
          mid:     "#3d2f1e",
          light:   "#7a6652",
        },
        parchment: "#faf3e8",
        paper:     "#fffef9",
        gold: {
          DEFAULT: "#c4973a",
          light:   "#e8c875",
        },
        // keep brand for any remaining uses
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
        },
      },
      boxShadow: {
        vintage:  "0 2px 12px 0 rgba(26,18,8,0.08), 0 0 0 1px rgba(196,151,58,0.10)",
        "vintage-lg": "0 8px 32px 0 rgba(26,18,8,0.12), 0 0 0 1px rgba(196,151,58,0.12)",
        card:     "0 1px 4px 0 rgba(26,18,8,0.06)",
      },
      borderRadius: {
        vintage: "3px",
      },
    },
  },
  plugins: [],
};

export default config;
