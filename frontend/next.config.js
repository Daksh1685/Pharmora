/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["@tabler/icons-react", "framer-motion"],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90, 100],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;
