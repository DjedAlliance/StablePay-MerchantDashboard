/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/StablePay-MerchantDashboard',
  assetPrefix: '/StablePay-MerchantDashboard/',
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: '/StablePay-MerchantDashboard',
  },
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
