/** @type {import('tailwindcss').Config} */
// @ts-ignore
import daisyui from 'daisyui';

const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'nexpo-blue': '#1e40af',
        'nexpo-gray': '#374151',
        'nexpo-light-gray': '#D9D9D9',
        'vnpt-blue': '#1e40af',
        'vnpt-light-blue': '#3b82f6',
        'vnpt-gray': '#374151',
        'vnpt-light-gray': '#9ca3af',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          primary: '#1e40af',
          secondary: '#374151',
          accent: '#3b82f6',
          neutral: '#374151',
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#f3f4f6',
          info: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
    ],
  },
};

export default config;
