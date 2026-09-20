import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
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
