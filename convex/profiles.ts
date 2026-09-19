import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
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
      throw new Error("NIM/NIP wajib diisi")
    }

    await ctx.db.patch(profile._id, {
      userKind: args.userKind,
      institutionalId,
      updatedAt: Date.now(),
    })

    return null
  },
})
