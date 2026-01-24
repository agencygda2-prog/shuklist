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
        // ShukList Orange Theme (Claude-inspired)
        primary: {
          DEFAULT: "#CC785C",
          light: "#E8997F",
          dark: "#B05A3E",
        },
        surface: "#F9F5F2",
        success: "#4CAF50",
        warning: "#FF9800",
        error: "#F44336",
      },
    },
  },
  plugins: [],
};

export default config;
