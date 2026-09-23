import {
  createClient,
  type AuthFunctions,
  type GenericCtx,
} from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { betterAuth } from "better-auth/minimal"
import { APIError } from "better-auth/api"
import { multiSession } from "better-auth/plugins"

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

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  // Keep the old sign-up route working until the new frontend is promoted.
  const pendingGateEnabled = env.PENDING_SESSION_GATE !== "false"
  return betterAuth({
    appName: "Sthana Kampus",
    baseURL: env.SITE_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    trustedOrigins: [env.SITE_URL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: !pendingGateEnabled,
      minPasswordLength: 8,
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            if (!pendingGateEnabled) return { data: session }
            if (!("runQuery" in ctx)) {
              throw new APIError("INTERNAL_SERVER_ERROR", {
                message: "Tidak dapat memeriksa status akun.",
              })
            }

            const status = await ctx.runQuery(
              internal.profiles.statusByAuthUserId,
              { authUserId: session.userId }
            )
            if (status !== "active") {
              const code =
                status === "pending"
                  ? "ACCOUNT_PENDING"
                  : status === "rejected"
                    ? "ACCOUNT_REJECTED"
                    : "ACCOUNT_DISABLED"
              throw new APIError("FORBIDDEN", {
                code,
                message: code,
              })
            }
            return { data: session }
          },
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    plugins: [convex({ authConfig }), multiSession({ maximumSessions: 5 })],
  })
}

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()
