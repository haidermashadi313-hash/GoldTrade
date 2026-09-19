import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Production optimization
  poweredByHeader: false,
  compress: true,

  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;