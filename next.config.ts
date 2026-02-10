import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/valentines",
        destination: "/valentines.html",
      },
    ];
  },
};

export default nextConfig;
