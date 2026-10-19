import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/consulting/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
