/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/StablePay-MerchantDashboard",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
