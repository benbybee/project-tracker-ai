/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres'],
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint on CI
  },
  // Disable static optimization for client-side heavy pages
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
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
