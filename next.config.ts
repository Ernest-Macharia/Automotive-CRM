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
};

export default nextConfig;