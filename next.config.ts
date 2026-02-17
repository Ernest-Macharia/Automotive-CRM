const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  logging: {
    fetches: {
      fullUrl: true,
    }
  },
};

module.exports = nextConfig;