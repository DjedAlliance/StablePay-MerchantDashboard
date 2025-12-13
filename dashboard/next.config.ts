import type { NextConfig } from "next"

const isProd = process.env.NODE_ENV === 'production'
const repoName = 'StablePay-MerchantDashboard'

const nextConfig: NextConfig = {
  output: 'export', // Enable static HTML export
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
