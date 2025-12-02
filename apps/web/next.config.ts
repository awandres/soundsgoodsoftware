import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@soundsgood/ui", "@soundsgood/db", "@soundsgood/auth"],
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "10mb", // For file uploads
    },
  },
};

export default nextConfig;

