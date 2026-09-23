import betterAuth from "@convex-dev/better-auth/convex.config"
import { defineApp } from "convex/server"
import { v } from "convex/values"

const app = defineApp({
  env: {
    BETTER_AUTH_SECRET: v.string(),
    BOOTSTRAP_SECRET: v.string(),
    PENDING_SESSION_GATE: v.optional(v.string()),
    AUTH_PREVIEW_ORIGIN: v.optional(v.string()),
    SITE_URL: v.string(),
  },
})

app.use(betterAuth)

export default app
