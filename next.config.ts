const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const buildApiProxyRewrite = () => {
  const configuredApiUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL || '');
  if (!configuredApiUrl || !/^https?:\/\//i.test(configuredApiUrl)) {
    return null;
  }

  try {
    const parsed = new URL(configuredApiUrl);
    const normalizedPath = trimTrailingSlash(parsed.pathname || '');
    const proxySourceBase = trimTrailingSlash(`/_api_proxy${normalizedPath}`) || '/_api_proxy';
    const destinationBase = `${parsed.origin}${normalizedPath}`;

    return {
      source: `${proxySourceBase}/:path*`,
      destination: `${destinationBase}/:path*`,
    };
  } catch {
    return null;
  }
};

const apiProxyRewrite = buildApiProxyRewrite();

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
  async redirects() {
    return [
      {
        source: '/webforms',
        destination: '/settings/webforms',
        permanent: false,
      },
      {
        source: '/webforms/:path*',
        destination: '/settings/webforms/:path*',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    if (!apiProxyRewrite) {
      return [];
    }
    return [apiProxyRewrite];
  },
};

module.exports = nextConfig;
