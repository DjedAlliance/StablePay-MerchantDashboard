/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Required for GitHub Pages (Generates static HTML)
  output: 'export',

  // 2. Disable server-side image optimization (Required for static export)
  images: {
    unoptimized: true,
  },

  // 3. Base Path Configuration
  // UNCOMMENT the line below if testing on your personal fork (e.g., username.github.io/repo-name)
  // KEEP COMMENTED OUT for the main repository deployment (custom domain)
  // basePath: '/StablePay-MerchantDashboard',

  // 4. Webpack fixes (Keep your existing configuration)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      "encoding": false,
      "lokijs": false,
    };

    return config;
  },
};

export default nextConfig;