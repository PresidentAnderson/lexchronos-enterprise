/** @type {import('next').NextConfig} */

const nextConfig = {
  // Remove static export for Netlify Functions support
  trailingSlash: true,
  
  // Images configuration for Netlify
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
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /require\.extensions/,
    ];

    return config;
  },

  // Build optimizations
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
};

export default nextConfig;