/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4C9A2A",
          50: "#F0F9EA",
          100: "#DCF0CE",
          200: "#BEE4A3",
          300: "#99D471",
          400: "#71BE47",
          500: "#4C9A2A",
          600: "#3D7F21",
          700: "#31651B",
          800: "#294F19",
          900: "#234117",
        },
        accent2: {
          DEFAULT: "#FF9F1C",
          50: "#FFF6E8",
          100: "#FFE8C2",
          200: "#FFD088",
          300: "#FFB84D",
          400: "#FFA929",
          500: "#FF9F1C",
          600: "#DB7F0C",
          700: "#B3630A",
        },
        success: "#16a34a",
        danger: "#D14D3A",
      },
    },
  },
  plugins: [],
};
