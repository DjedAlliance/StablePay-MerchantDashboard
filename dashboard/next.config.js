/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
    output: 'export',
    basePath: isProd ? '/StablePay-MerchantDashboard' : '',
    assetPrefix: isProd ? '/StablePay-MerchantDashboard/' : '',
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
