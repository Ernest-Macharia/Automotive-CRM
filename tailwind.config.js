module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VIN17x Brand Colors
        'mag': {
          'orange': '#E65C00',
          'amber': '#C44A00',
          'charcoal': '#1A1A1A',
          'lightgray': '#CCCCCC',
          'alert': '#FF3300',
          'white': '#FFFFFF',
          'dark': '#0B0B0B',
          'border': '#2A2A2A',
          'muted': '#666666',
        }
      }
    },
  },
  plugins: [],
}