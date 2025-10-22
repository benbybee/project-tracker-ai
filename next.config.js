/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true }, // re-enable later if you want
  // Disable static optimization for client-side heavy pages
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  // Ensure proper asset handling
  // Disable x-powered-by header
  poweredByHeader: false,
  // Ensure consistent builds
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Optimize for production
  compress: true,
  // Ensure proper static asset handling
  images: {
    unoptimized: false,
  },
  // Optimize for Vercel deployment
  // Ensure proper chunk loading
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Ensure deterministic builds
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    };
    
    return config;
  },
  // experimental: {
  //   appDir: true, // Deprecated in Next.js 15
  // },
  // PWA configuration
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Ensure static files are served correctly
  // async rewrites() {
  //   return [
  //     {
  //       source: '/service-worker.js',
  //       destination: '/_next/static/service-worker.js',
  //     },
  //   ];
  // },
}

module.exports = nextConfig
