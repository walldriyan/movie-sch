// Load environment variables first
require('dotenv').config();

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ================================================================
  // PRODUCTION OPTIMIZATION
  // ================================================================

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Output configuration for Vercel
  output: process.env.VERCEL ? undefined : 'standalone',

  // Compression
  compress: true,

  // Power pages with headers
  poweredByHeader: false,

  // Generate unique build IDs
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },

  // External packages (not bundled in serverless)
  serverExternalPackages: [
    'jsdom',
    'parse5',
    'isomorphic-dompurify',
    '@prisma/client',
    'prisma',
    'bcryptjs',
  ],

  // ================================================================
  // IMAGE OPTIMIZATION
  // ================================================================
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '**.supabase.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  // ================================================================
  // REDIRECTS - Reduce serverless function count
  // ================================================================
  async redirects() {
    return [
      { source: '/movies', destination: '/search?type=MOVIE', permanent: true },
      { source: '/movies/:id', destination: '/search?movieId=:id', permanent: true },
      { source: '/series', destination: '/search?type=TV_SERIES', permanent: true },
      { source: '/groups', destination: '/search?type=groups', permanent: true },
      { source: '/exams/:id', destination: '/search?examId=:id', permanent: true },
      { source: '/profile/:username', destination: '/search?profileId=:username', permanent: true },
      { source: '/admin/exams', destination: '/admin', permanent: true },
      { source: '/admin/exams/:id', destination: '/admin', permanent: true },
      { source: '/admin/exams/:id/results', destination: '/admin', permanent: true },
      { source: '/activity', destination: '/', permanent: false },
    ];
  },

  // ================================================================
  // SECURITY HEADERS
  // ================================================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },

  // ================================================================
  // WEBPACK CONFIGURATION
  // ================================================================
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /@opentelemetry\/instrumentation/,
          message: /Critical dependency: the request of a dependency is an expression/,
        },
      ];
    }

    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }

    return config;
  },

  // ================================================================
  // EXPERIMENTAL FEATURES - Package optimization
  // ================================================================
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'date-fns',
      'react-hook-form',
      'zod',
      'cmdk',
    ],
  },

  // ================================================================
  // LOGGING
  // ================================================================
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

module.exports = withBundleAnalyzer(nextConfig);
