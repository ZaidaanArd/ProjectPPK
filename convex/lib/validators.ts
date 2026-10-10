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
  v.literal("cancelled"),
  v.literal("expired")
)

export const reportStatusValidator = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("rejected")
)

export const handlingImpactValidator = v.union(
  v.literal("usable"),
  v.literal("closed")
)

export const maintenanceStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("completed"),
  v.literal("cancelled")
)

export const issueStatusValidator = v.union(
  v.literal("open"),
  v.literal("closed")
)

export const closureStatusValidator = v.union(
  v.literal("closed"),
  v.literal("reopened")
)

export const notificationTypeValidator = v.union(
  v.literal("reservation.approved"),
  v.literal("reservation.rejected"),
  v.literal("reservation.cancelled"),
  v.literal("reservation.expired"),
  v.literal("reservation.change_decided"),
  v.literal("reservation.change_conflict"),
  v.literal("disruption.created"),
  v.literal("disruption.updated"),
  v.literal("disruption.resolved"),
  v.literal("emergency.closed"),
  v.literal("maintenance.reminder")
)

export const auditEntityValidator = v.union(
  v.literal("account"),
  v.literal("facility"),
  v.literal("reservation"),
  v.literal("report"),
  v.literal("maintenance"),
  v.literal("disruption"),
  v.literal("closure")
)

export const actorRoleValidator = v.union(roleValidator, v.literal("system"))
