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
  }
};

export default nextConfig;
