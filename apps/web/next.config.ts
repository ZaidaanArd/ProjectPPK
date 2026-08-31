import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/contracts", "@workspace/ui"],
}

export default nextConfig
