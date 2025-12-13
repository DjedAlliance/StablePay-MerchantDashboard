/** @type {import('next').NextConfig} */
const nextConfig = {
  
  output: 'export',
  
  
  images: {
    unoptimized: true,
  },



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