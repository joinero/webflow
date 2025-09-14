import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/calculator/:path*',
        destination: '/:path*',
      },
      {
        source: '/api/proxy-goal-forecast',
        destination: 'https://webflow-kappa.vercel.app/api/goal-forecast',
      },
    ];
  },
};

export default nextConfig;