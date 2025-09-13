import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  basePath: '/calculator',
  assetPrefix: '/calculator',
  reactStrictMode: true,
};

export default nextConfig;