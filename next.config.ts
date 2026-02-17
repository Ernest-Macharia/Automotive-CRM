const nextConfig = {
  output: 'out',
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