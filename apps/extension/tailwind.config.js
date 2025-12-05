/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,ts,jsx,js}"],
  theme: {
    extend: {
      colors: {
        xferno: {
          orange: "#f97316",
          red: "#ef4444",
          dark: "#0f0f0f",
        },
      },
    },
  },
  plugins: [],
};
