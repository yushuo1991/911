/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // 自定义股票色彩系统 - 基于用户指定色值
    'bg-stock-red-100', 'bg-stock-red-200', 'bg-stock-red-300', 'bg-stock-red-400', 'bg-stock-red-500', 'bg-stock-red-600',
    'bg-stock-green-100', 'bg-stock-green-200', 'bg-stock-green-300', 'bg-stock-green-400', 'bg-stock-green-500',
    'bg-stock-dark',
    'bg-stock-orange-100', 'bg-stock-orange-400', 'bg-stock-orange-600',
    // 对应文字颜色
    'text-red-700', 'text-red-800', 'text-red-900', 'text-green-700', 'text-green-800', 'text-green-900',
    'text-white', 'text-slate-600', 'text-slate-700', 'text-gray-900',
    'text-stock-orange-700', 'text-stock-orange-800',
    // 保留原有颜色以防需要
    'bg-orange-600', 'bg-red-400', 'bg-red-500', 'bg-rose-400', 'bg-rose-200', 'bg-rose-100',
    'bg-teal-600', 'bg-emerald-400', 'bg-emerald-500', 'bg-green-400', 'bg-green-200', 'bg-green-100',
    'bg-slate-100', 'bg-slate-200',
    'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-600', 'bg-red-700', 'bg-red-800', 'bg-red-900',
    'bg-green-50', 'bg-green-300', 'bg-green-500', 'bg-green-600', 'bg-green-700', 'bg-green-800', 'bg-green-900',
    'bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600', 'bg-purple-700',
    'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-600', 'bg-gray-700', 'bg-gray-900',
    // 样式类
    'font-bold', 'font-semibold', 'font-medium', 'font-normal',
    'text-2xs', 'text-xs', 'text-sm', 'text-lg', 'text-xl', 'rounded', 'rounded-md', 'rounded-lg', 'px-1', 'px-2', 'px-3', 'py-1', 'py-2', 'text-center', 'text-left', 'text-right',
    'min-w-[45px]', 'inline-block', 'block', 'inline', 'shadow-sm'
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }], // 自定义超小字体
      },
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
        // 自定义股票颜色方案
        stock: {
          // 上涨红色系 - 基于 #da4453
          'red-100': '#fdf2f4',  // 最淡红色
          'red-200': '#fce7ea',  // 淡红色
          'red-300': '#f8b6c1',  // 浅红色
          'red-400': '#f28a9a',  // 中红色
          'red-500': '#ec5f73',  // 深红色
          'red-600': '#da4453',  // 涨停红色

          // 下跌绿色系 - 基于 #37bc9b
          'green-100': '#f0fdf9', // 最淡绿色
          'green-200': '#dcfcf0', // 淡绿色
          'green-300': '#86efcf', // 浅绿色
          'green-400': '#5dd5b0', // 中绿色
          'green-500': '#37bc9b', // 大跌绿色

          // 跌停深色 - #434a54
          'dark': '#434a54',     // 跌停深灰蓝

          // 成交额橙色系 - 基于 #E9573F 和 #FCFCE5
          'orange-100': '#FCFCE5', // 浅橙色
          'orange-400': '#FC6E51', // 中橙色
          'orange-600': '#E9573F', // 深橙色
          'orange-700': '#C73E1D', // 深橙色文字
          'orange-800': '#A83418', // 更深橙色文字
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