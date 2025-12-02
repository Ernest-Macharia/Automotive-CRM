module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef6f2',
          100: '#fde8dd',
          200: '#fbd0b8',
          300: '#f8af87',
          400: '#f38251',
          500: '#f15f2e',
          600: '#e55a2b',
          700: '#c0451d',
          800: '#9f391c',
          900: '#82331c',
        }
      }
    },
  },
  plugins: [],
}