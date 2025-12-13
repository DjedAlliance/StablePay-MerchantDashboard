import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/StablePay-MerchantDashboard",
  assetPrefix: "/StablePay-MerchantDashboard/",
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
