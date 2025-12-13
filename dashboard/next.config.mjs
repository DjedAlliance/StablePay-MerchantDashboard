/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/StablePay-MerchantDashboard",
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
