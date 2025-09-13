import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  basePath: '/calculator', 
  assetPrefix: '/calculator', 
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/calculator/:path*',  
        destination: '/:path*', 
      },
    ];
  },
};

export default nextConfig;