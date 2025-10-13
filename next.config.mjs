/** @type {import('next').NextConfig} */

// Import i18n configuration
import i18nConfig from './next-i18next.config.js';

const nextConfig = {
  // Internationalization
  i18n: i18nConfig.i18n,
  // PWA Configuration
  experimental: {
    webpackBuildWorker: true,
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // Headers for PWA
  async headers() {
    return [
      {
        source: '/sw.js',
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
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Compression
  compress: true,

  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Enable SWC minification
  swcMinify: true,

  // Webpack configuration to suppress Handlebars warnings
  webpack: (config, { isServer }) => {
    // Suppress require.extensions warnings from handlebars
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Ignore handlebars require.extensions warning
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /require\.extensions/,
    ];

    // Exclude email templates from webpack processing
    config.module.rules.push({
      test: /\.hbs$/,
      use: 'raw-loader',
    });

    return config;
  },
};

export default nextConfig;