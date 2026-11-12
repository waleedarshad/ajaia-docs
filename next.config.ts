import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker uses the standalone server; Vercel builds its own output, so skip it there.
  output: process.env.VERCEL ? undefined : "standalone",
  serverExternalPackages: ["mammoth"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
