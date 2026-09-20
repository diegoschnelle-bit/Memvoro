/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#FFFFFF",        // fondo blanco base
        char: "#F6F1E9",       // superficie secundaria (crema cálido claro)
        cream: "#1C1917",      // texto principal (oscuro)
        bone: "#78716C",       // texto secundario (gris cálido)
        volt: "#D97757",       // naranja/terracota Claude - #1 / money / CTA
        gold: "#B45309",       // ámbar cálido - Hall of Fame
        rust: "#DC2626",       // estados de error
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};
