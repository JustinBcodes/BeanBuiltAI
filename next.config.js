/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Ensures API routes are treated as serverless functions
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  // Explicitly mark API routes as dynamic
  experimental: {
    outputFileTracingRoot: undefined,
  },
  // Force all API routes to be dynamic
  rewrites: async () => {
    return [];
  },
}

module.exports = nextConfig 