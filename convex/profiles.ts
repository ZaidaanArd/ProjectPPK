import { ConvexError, v } from "convex/values"

import { internalQuery, mutation, query } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { getCurrentProfile, requireProfile } from "./lib/authz"
import { accountStatusValidator, roleValidator } from "./lib/validators"

const currentProfileValidator = v.union(
  v.null(),
  v.object({
    id: v.id("profiles"),
    name: v.string(),
    email: v.string(),
    role: roleValidator,
    status: accountStatusValidator,
    mustChangePassword: v.boolean(),
  })
)

export const current = query({
  args: {},
  returns: currentProfileValidator,
  handler: async (ctx) => {
    const profile = await getCurrentProfile(ctx)

    if (!profile) {
      return null
    }

    return {
      id: profile._id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      mustChangePassword: profile.mustChangePassword,
    }
  },
})

export const statusByAuthUserId = internalQuery({
  args: { authUserId: v.string() },
  returns: v.union(accountStatusValidator, v.null()),
  handler: async (ctx, { authUserId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
      .unique()
    return profile?.status ?? null
  },
})

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    // Ignored. Accepted so frontends cached from before sign-up was
    // simplified keep working after a backend deploy.
    userKind: v.optional(v.union(v.literal("student"), v.literal("lecturer"))),
    institutionalId: v.optional(v.string()),
  },
  returns: v.union(v.literal("created"), v.literal("exists")),
  handler: async (ctx, args) => {
    const name = args.name.trim()
    const email = args.email.trim().toLowerCase()
    if (!name || !email) {
      throw new ConvexError("Nama dan email wajib diisi")
    }
    if (args.password.length < 8) {
      throw new ConvexError("Password minimal 8 karakter")
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    if (existing) return "exists"

    const { auth } = await authComponent.getAuth(createAuth, ctx)
    const result = await auth.api.signUpEmail({
      body: { name, email, password: args.password },
    })
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", result.user.id))
      .unique()
    return profile ? "created" : "exists"
  },
})

export const changePassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new ConvexError("Password baru minimal 8 karakter")
    }

    const profile = await requireProfile(ctx)
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    await auth.api.changePassword({
      body: {
        currentPassword: args.currentPassword,
        newPassword: args.newPassword,
        revokeOtherSessions: true,
      },
      headers,
    })

    if (profile.mustChangePassword) {
      await ctx.db.patch("profiles", profile._id, {
        mustChangePassword: false,
        updatedAt: Date.now(),
      })
    }

    return null
  },
})
