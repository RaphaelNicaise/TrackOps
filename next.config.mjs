/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable Webpack disk pack file cache in dev to avoid Windows ENOENT & stale chunk 404 issues
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
