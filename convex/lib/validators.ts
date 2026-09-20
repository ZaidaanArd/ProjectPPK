import { v } from "convex/values"

export const roleValidator = v.union(
  v.literal("user"),
  v.literal("officer"),
  v.literal("admin")
)

export const accountStatusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("rejected"),
  v.literal("disabled")
)

export const facilityStatusValidator = v.union(
  v.literal("active"),
  v.literal("maintenance"),
  v.literal("inactive")
)

export const reservationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled")
)

export const reportStatusValidator = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("rejected")
)

export const auditEntityValidator = v.union(
  v.literal("account"),
  v.literal("facility"),
  v.literal("reservation"),
  v.literal("report")
)

export const actorRoleValidator = v.union(roleValidator, v.literal("system"))
