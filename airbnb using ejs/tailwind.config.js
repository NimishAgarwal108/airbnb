/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",    // scan all EJS files
    "./public/**/*.js"     // scan any JS that might have Tailwind classes
  ],
 
  theme: {
    extend: {},
  },
  plugins: [],
}
