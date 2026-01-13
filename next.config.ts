import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  reactStrictMode: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Disable source maps in production for smaller bundle
  productionBrowserSourceMaps: false,

  // Enable compression
  compress: true,

  // Power by header (optional security)
  poweredByHeader: false,
};

export default nextConfig;
