/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint is run separately in CI; skip during `next build` to avoid config issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type-checking is done separately; don't block Vercel deploys
    ignoreBuildErrors: false,
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: '**.walrus.xyz',
      },
      {
        protocol: 'https',
        hostname: 'aggregator.walrus-testnet.walrus.space',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;