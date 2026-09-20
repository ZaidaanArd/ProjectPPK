import {
  createClient,
  type AuthFunctions,
  type GenericCtx,
} from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { betterAuth } from "better-auth/minimal"

import { components, internal } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import { env } from "./_generated/server"
import authConfig from "./auth.config"

const authFunctions: AuthFunctions = internal.auth

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, user) => {
        const now = Date.now()

        await ctx.db.insert("profiles", {
          authUserId: user._id,
          name: user.name.trim(),
          email: user.email.trim().toLowerCase(),
          role: "user",
          status: "pending",
          mustChangePassword: false,
          createdAt: now,
          updatedAt: now,
        })
      },
      onUpdate: async (ctx, user) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
          .unique()

        if (profile) {
          await ctx.db.patch("profiles", profile._id, {
            name: user.name.trim(),
            email: user.email.trim().toLowerCase(),
            updatedAt: Date.now(),
          })
        }
      },
      onDelete: async (ctx, user) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
          .unique()

        if (profile) {
          await ctx.db.patch("profiles", profile._id, {
            status: "disabled",
            updatedAt: Date.now(),
          })
        }
      },
    },
  },
})

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    appName: "Sthana Kampus",
    baseURL: env.SITE_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    trustedOrigins: [env.SITE_URL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    plugins: [convex({ authConfig })],
  })

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()
