/** @type {import('tailwindcss').Config} */
export default { 
  content: ['./index.html', './src/**/*.{ts,tsx}'], 
  theme: { 
    extend: {
      colors: {
        console: {
          bg: '#0B1220',
          sidebar: '#0B1220',
          card: 'transparent',
          elevated: '#162338',
          border: '#3F4F6B',
          subtle: '#2A3649',
          hover: '#1B2A40',
          text: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#64748B',
          brand: '#22C7E8',
          brandHover: '#06B6D4',
          brandSubtle: 'rgba(34, 199, 232, 0.10)',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          ai: '#A78BFA',
          aiSubtle: 'rgba(167, 139, 250, 0.08)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    } 
  }, 
  plugins: [],
};

