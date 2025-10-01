import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app.nexpo.vn",
        pathname: "/assets/**",
      },
    ],
  },
};

export default nextConfig;
