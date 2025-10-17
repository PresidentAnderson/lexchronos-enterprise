/** @type {import('next').NextConfig} */

const nextConfig = {
  // Static export configuration for demo
  output: 'export',
  trailingSlash: true,
  
  // Disable features not supported in static export
  images: {
    unoptimized: true,
  },
  
  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Enable SWC minification
  swcMinify: true,

  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /require\.extensions/,
    ];

    return config;
  },

  // Environment variables for demo
  env: {
    DEMO_MODE: 'true',
    DISABLE_DATABASE: 'true',
  },

  // Skip type and lint checks during demo builds
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;