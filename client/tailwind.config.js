/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1044A0',
          50: '#E8EDF7',
          100: '#D1DBEF',
          200: '#A3B7DF',
          300: '#7593CF',
          400: '#476FBF',
          500: '#1044A0',
          600: '#0D3780',
          700: '#0A2A60',
          800: '#061C40',
          900: '#030E20',
        },
        secondary: {
          DEFAULT: '#7C3AED',
          50: '#F3EEFE',
          100: '#E7DDFD',
          200: '#CFBBFB',
          300: '#B799F9',
          400: '#9F77F7',
          500: '#7C3AED',
          600: '#6320D0',
          700: '#4A189C',
          800: '#321068',
          900: '#190834',
        },
        emergency: '#DC2626',
        warning: '#F59E0B',
        success: '#10B981',
        clinical: {
          white: '#F8FAFC',
          surface: '#FFFFFF',
          alt: '#F1F5F9',
          border: '#E2E8F0',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'level-1': '0 1px 3px rgba(0,0,0,0.08)',
        'level-2': '0 4px 12px rgba(0,0,0,0.10)',
        'level-3': '0 8px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
