import { ConvexError } from "convex/values"

import type { Doc } from "../_generated/dataModel"
import type { QueryCtx, MutationCtx } from "../_generated/server"
import { authComponent } from "../auth"

type AuthContext = QueryCtx | MutationCtx

export async function getCurrentProfile(ctx: AuthContext) {
  const authUser = await authComponent.safeGetAuthUser(ctx)

  if (!authUser) {
    return null
  }

  return ctx.db
    .query("profiles")
    .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser._id))
    .unique()
}

export async function requireProfile(ctx: AuthContext) {
  const profile = await getCurrentProfile(ctx)

  if (!profile) {
    throw new ConvexError("Anda harus masuk untuk melanjutkan")
  }

  return profile
}

export async function requireActiveProfile(ctx: AuthContext) {
  const profile = await requireProfile(ctx)

  if (profile.status !== "active") {
    throw new ConvexError("Akun belum aktif")
  }

  return profile
}

export async function requireRole(
  ctx: AuthContext,
  allowedRoles: Array<Doc<"profiles">["role"]>
) {
  const profile = await requireActiveProfile(ctx)

  if (!allowedRoles.includes(profile.role)) {
    throw new ConvexError("Anda tidak memiliki izin untuk tindakan ini")
  }

  return profile
}
