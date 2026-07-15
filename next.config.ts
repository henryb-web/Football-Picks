import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Avatar photos from a camera roll are commonly a few MB; the default
    // Server Action body limit is 1MB, which would reject them.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
