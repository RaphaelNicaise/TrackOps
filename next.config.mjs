/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["gsap", "framer-motion", "motion"],
  // Permitir dev desde 127.0.0.1 sin warnings de cross-origin
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
