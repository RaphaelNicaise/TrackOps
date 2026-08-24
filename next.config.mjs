/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["gsap"],
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
