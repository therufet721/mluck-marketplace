/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'chain.mluck.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chain.mluck.io',
        pathname: '**',
      }
    ],
    unoptimized: true, // Disable image optimization to avoid issues with remote images
  },
  // Add output configuration for better stability
  output: 'standalone',
  // Optimize chunks
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for third-party libraries
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
  // Increase chunk size limit
  experimental: {
    largePageDataBytes: 128 * 100000, // Increase to 12.8MB
  },
};

export default nextConfig; 