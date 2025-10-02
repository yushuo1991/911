/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // 基础股票色彩系统
    'bg-stock-red-100', 'bg-stock-red-200', 'bg-stock-red-300', 'bg-stock-red-400', 'bg-stock-red-500', 'bg-stock-red-600',
    'bg-stock-green-100', 'bg-stock-green-200', 'bg-stock-green-300', 'bg-stock-green-400', 'bg-stock-green-500',
    'bg-stock-dark',
    // 文字颜色
    'text-red-700', 'text-red-800', 'text-red-900', 'text-green-700', 'text-green-800', 'text-green-900',
    'text-white', 'text-slate-600', 'text-slate-700', 'text-gray-900',
    // 背景颜色
    'bg-orange-600', 'bg-red-400', 'bg-red-500', 'bg-rose-400', 'bg-rose-200', 'bg-rose-100',
    'bg-teal-600', 'bg-emerald-400', 'bg-emerald-500', 'bg-green-400', 'bg-green-200', 'bg-green-100',
    'bg-slate-100', 'bg-slate-200',
    'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-600', 'bg-red-700', 'bg-red-800', 'bg-red-900',
    'bg-green-50', 'bg-green-300', 'bg-green-500', 'bg-green-600', 'bg-green-700', 'bg-green-800', 'bg-green-900',
    'bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600', 'bg-purple-700',
    'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-600', 'bg-gray-700', 'bg-gray-900',
    // 样式类
    'font-bold', 'font-semibold', 'font-medium', 'font-normal',
    'text-xs', 'text-sm', 'rounded', 'rounded-md', 'rounded-lg', 'px-1', 'px-1.5', 'px-2', 'px-3', 'py-0.5', 'py-1', 'py-2', 'text-center', 'text-left', 'text-right',
    'min-w-[40px]', 'min-w-[45px]', 'inline-block', 'block', 'inline', 'shadow-sm'
  ],
  theme: {
    extend: {
      colors: {
        // 基础金融配色
        'finance-bg-primary': '#fafbfc',
        'finance-bg-secondary': '#f8f9fa',
        'finance-text-primary': '#202124',
        'finance-text-secondary': '#5f6368',
        'finance-text-tertiary': '#80868b',
        'finance-accent': '#1a73e8',
        'finance-accent-hover': '#1557b0',
        'finance-border-light': '#e8eaed',
        'finance-border': '#dadce0',
        'finance-panel': '#ffffff',
        'finance-panel-hover': '#f1f3f4',
        'finance-success': '#137333',
        'finance-warning': '#ea8600',
        'finance-error': '#d93025',

        // 股票涨跌色系
        'stock-up-100': '#fdeaea',
        'stock-up-200': '#fbd4d4',
        'stock-up-300': '#f7a6a6',
        'stock-up-400': '#f27777',
        'stock-up-500': '#ec4444',
        'stock-up-600': '#dc2626',
        'stock-up-700': '#b91c1c',
        'stock-up-800': '#991b1b',

        'stock-down-100': '#dcfce7',
        'stock-down-200': '#bbf7d0',
        'stock-down-300': '#86efac',
        'stock-down-400': '#4ade80',
        'stock-down-500': '#22c55e',
        'stock-down-600': '#16a34a',
        'stock-down-700': '#15803d',

        'stock-flat': '#6b7280',
      },
      // 基础动画
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}