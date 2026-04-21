/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#ac2c00",
        "primary-container": "#ff7852",
        "on-primary": "#ffefec",
        "secondary": "#005da4",
        "secondary-container": "#b6d4ff",
        "on-secondary": "#eef3ff",
        "background": "#f5f6f7",
        "on-background": "#2c2f30",
        "surface": "#f5f6f7",
        "surface-bright": "#f5f6f7",
        "surface-container": "#e6e8ea",
        "surface-container-high": "#e0e3e4",
        "surface-container-highest": "#dadddf",
        "surface-container-low": "#eff1f2",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#2c2f30",
        "on-surface-variant": "#595c5d",
        "outline": "#757778",
        "outline-variant": "rgba(171, 173, 174, 0.15)",
      },
      fontFamily: {
        headlines: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
}

