import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 force Next.js to treat this project folder as the root
  outputFileTracingRoot: __dirname,

  reactStrictMode: true,
};

export default nextConfig;
