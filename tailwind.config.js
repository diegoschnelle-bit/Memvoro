/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A08",        // fondo negro base
        char: "#161410",       // superficie secundaria
        cream: "#F0E9D8",      // texto / fondos claros
        bone: "#C9C0AA",       // texto secundario sobre negro
        volt: "#E8FF3C",       // amarillo neón - acción / #1
        gold: "#FFC94A",       // corona / rango alto
        rust: "#C24C2E",       // estados de error / caída de rango
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};
