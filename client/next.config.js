const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  }
};

module.exports = nextConfig;
