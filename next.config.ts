import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    // Force all chunks to be part of the main bundle in production
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Merge all chunks into main
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 1,
            reuseExistingChunk: true,
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
