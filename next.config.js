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

  // Disable build errors for faster iteration (remove in strict production)
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'production' || process.env.SKIP_TYPE_CHECK === 'true',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production' || process.env.SKIP_LINT === 'true',
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

  // Handle ESM modules in server components
  serverExternalPackages: ['jsdom', 'parse5', 'isomorphic-dompurify'],

  // ================================================================
  // IMAGE OPTIMIZATION
  // ================================================================
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // ================================================================
  // REDIRECTS - Reduce serverless function count (FREE - no function cost!)
  // ================================================================
  async redirects() {
    return [
      // Movies page -> Search with MOVIE filter
      {
        source: '/movies',
        destination: '/search?type=MOVIE',
        permanent: true,
      },
      // Series page -> Search with TV_SERIES filter  
      {
        source: '/series',
        destination: '/search?type=TV_SERIES',
        permanent: true,
      },
      // Admin exams pages -> Main admin page
      {
        source: '/admin/exams',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/admin/exams/:id',
        destination: '/admin',
        permanent: true,
      },
      {
        source: '/admin/exams/:id/results',
        destination: '/admin',
        permanent: true,
      },
      // Activity page -> Home
      {
        source: '/activity',
        destination: '/',
        permanent: false,
      },
      // Exams results -> Exams page with tab
      {
        source: '/exams/:id/results',
        destination: '/exams/:id?tab=results',
        permanent: true,
      },
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
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
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
        minimize: false,
      };
    }

    return config;
  },

  // ================================================================
  // EXPERIMENTAL FEATURES
  // ================================================================
  experimental: {},

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
