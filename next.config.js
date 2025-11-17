// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // ✅ Temporary: Ignore ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;