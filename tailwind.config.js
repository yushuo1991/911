/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // 确保涨跌幅色彩类被包含在编译中 - 扩展覆盖
    'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-red-800', 'bg-red-900',
    'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600', 'bg-green-700', 'bg-green-800', 'bg-green-900',
    'bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600', 'bg-purple-700',
    'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-600', 'bg-gray-700',
    'text-white', 'text-red-50', 'text-red-100', 'text-red-200', 'text-red-700', 'text-red-800', 'text-red-900', 
    'text-green-50', 'text-green-100', 'text-green-200', 'text-green-700', 'text-green-800', 'text-green-900', 'text-gray-600', 'text-gray-700',
    'font-bold', 'font-semibold', 'font-medium', 'font-normal',
    'text-xs', 'text-sm', 'rounded', 'rounded-md', 'rounded-lg', 'px-1', 'px-2', 'px-3', 'py-1', 'py-2', 'text-center', 'text-left', 'text-right',
    'min-w-[45px]', 'inline-block', 'block', 'inline'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}