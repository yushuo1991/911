/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // 启用standalone模式用于Docker部署
  reactStrictMode: true,
  swcMinify: true,

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://apphq.longhuvip.com/:path*',
      },
    ]
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '4.1-docker',
  },

  // 图片优化配置
  images: {
    domains: ['image.sinajs.cn'],
    unoptimized: true,  // Docker环境禁用图片优化
  },

  // TypeScript和ESLint配置
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig