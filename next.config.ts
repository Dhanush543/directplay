// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Tree-shake lucide-react icons better
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;