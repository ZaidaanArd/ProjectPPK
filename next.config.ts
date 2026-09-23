import type { NextConfig } from "next"

const dataMode = process.env.NEXT_PUBLIC_DATA_MODE ?? "dynamic"
if (dataMode !== "dynamic" && dataMode !== "static") {
  throw new Error("NEXT_PUBLIC_DATA_MODE must be dynamic or static")
}
if (process.env.NODE_ENV === "production" && dataMode === "static") {
  throw new Error("Static data mode is only available during development")
}

const nextConfig: NextConfig = {
  agentRules: false,
}

export default nextConfig
