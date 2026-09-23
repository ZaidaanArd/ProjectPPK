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
    userKind: v.union(v.literal("student"), v.literal("lecturer")),
    institutionalId: v.string(),
  },
  returns: v.union(v.literal("created"), v.literal("exists")),
  handler: async (ctx, args) => {
    const name = args.name.trim()
    const email = args.email.trim().toLowerCase()
    const institutionalId = args.institutionalId.trim()
    if (!name || !email || !institutionalId) {
      throw new ConvexError("Nama, email, dan NIM/NIP wajib diisi")
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
    if (!profile) return "exists"

    await ctx.db.patch("profiles", profile._id, {
      userKind: args.userKind,
      institutionalId,
      updatedAt: Date.now(),
    })
    return "created"
  },
})

export const completeRegistration = mutation({
  args: {
    userKind: v.union(v.literal("student"), v.literal("lecturer")),
    institutionalId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx)
    const institutionalId = args.institutionalId.trim()

    if (!institutionalId) {
      throw new ConvexError("NIM/NIP wajib diisi")
    }

    await ctx.db.patch("profiles", profile._id, {
      userKind: args.userKind,
      institutionalId,
      updatedAt: Date.now(),
    })

    return null
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
