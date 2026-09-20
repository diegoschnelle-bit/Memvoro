/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#09090B",        // fondo negro base
        char: "#29292E",       // superficie secundaria (dark gray)
        cream: "#F7F7F5",      // texto / fondos claros
        bone: "#92929A",       // texto secundario (secondary gray)
        volt: "#F5FF3B",       // amarillo neón - #1 / money / CTA
        gold: "#FFC94A",       // acento cálido - trono / corona
        riot: "#B14EFF",       // violeta - acento del modo "Today"
        rust: "#C24C2E",       // estados de error / caída de rango
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
