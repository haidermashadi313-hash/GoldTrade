import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  env: {
    NEXT_PUBLIC_APP_NAME: "GoldTrade V18 Enterprise",
  },
};

export default nextConfig;