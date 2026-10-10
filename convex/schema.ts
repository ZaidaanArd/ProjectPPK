import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
  accountStatusValidator,
  actorRoleValidator,
  auditEntityValidator,
  closureStatusValidator,
  facilityStatusValidator,
  handlingImpactValidator,
  issueStatusValidator,
  maintenanceStatusValidator,
  notificationTypeValidator,
  reportStatusValidator,
  reservationStatusValidator,
  roleValidator,
} from "./lib/validators"

export default defineSchema({
  profiles: defineTable({
    authUserId: v.string(),
    name: v.string(),
    email: v.string(),
    role: roleValidator,
    status: accountStatusValidator,
    userKind: v.optional(v.union(v.literal("student"), v.literal("lecturer"))),
    institutionalId: v.optional(v.string()),
    mustChangePassword: v.boolean(),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"]),

  facilities: defineTable({
    name: v.string(),
    type: v.string(),
    location: v.string(),
    capacity: v.number(),
    description: v.string(),
    status: facilityStatusValidator,
    createdBy: v.id("profiles"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_location", ["location"]),

  reservations: defineTable({
    userId: v.id("profiles"),
    facilityId: v.id("facilities"),
    purpose: v.string(),
    startAt: v.number(),
    endAt: v.number(),
    status: reservationStatusValidator,
    decisionNote: v.optional(v.string()),
    decidedBy: v.optional(v.id("profiles")),
    decidedAt: v.optional(v.number()),
    cancelledBy: v.optional(v.id("profiles")),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_facility_status_start", ["facilityId", "status", "startAt"])
    .index("by_status", ["status"])
    .index("by_start", ["startAt"]),

  reservationChanges: defineTable({
    reservationId: v.id("reservations"),
    userId: v.id("profiles"),
    facilityId: v.id("facilities"),
    originalStartAt: v.number(),
    originalEndAt: v.number(),
    startAt: v.number(),
    endAt: v.number(),
    reason: v.string(),
    status: reservationStatusValidator,
    decisionNote: v.optional(v.string()),
    decidedBy: v.optional(v.id("profiles")),
    decidedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reservation_status", ["reservationId", "status"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_facility_status_start", ["facilityId", "status", "startAt"]),

  reports: defineTable({
    reporterId: v.id("profiles"),
    facilityId: v.id("facilities"),
    category: v.string(),
    description: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    photoName: v.optional(v.string()),
    photoContentType: v.optional(v.string()),
    status: reportStatusValidator,
    handlingImpact: v.optional(handlingImpactValidator),
    resolutionNote: v.optional(v.string()),
    handledBy: v.optional(v.id("profiles")),
    handledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_facility_and_status", ["facilityId", "status"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Scheduled repairs. A window blocks reservations for its time range only;
  // it is completed by a scheduled job at endAt or early by staff.
  maintenanceWindows: defineTable({
    facilityId: v.id("facilities"),
    reportId: v.optional(v.id("reports")),
    reason: v.string(),
    startAt: v.number(),
    endAt: v.number(),
    status: maintenanceStatusValidator,
    createdBy: v.id("profiles"),
    closedBy: v.optional(v.id("profiles")),
    closedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_facility_status_start", ["facilityId", "status", "startAt"])
    .index("by_status_start", ["status", "startAt"])
    .index("by_report", ["reportId"]),

  // Light facility disruptions. Informational only: they never lock slots.
  // A disruption can start while its end is still unknown (endAt omitted).
  facilityIssues: defineTable({
    facilityId: v.id("facilities"),
    reportId: v.optional(v.id("reports")),
    category: v.string(),
    description: v.string(),
    startAt: v.number(),
    endAt: v.optional(v.number()),
    status: issueStatusValidator,
    revision: v.number(),
    createdBy: v.id("profiles"),
    closedBy: v.optional(v.id("profiles")),
    closedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_facility_status", ["facilityId", "status"])
    .index("by_status", ["status"])
    .index("by_report", ["reportId"]),

  // Safety closures. Decided manually: no auto-open from estimates, finished
  // reports or maintenance. Reopening never resurrects cancelled bookings.
  emergencyClosures: defineTable({
    facilityId: v.id("facilities"),
    reportId: v.optional(v.id("reports")),
    reason: v.string(),
    estimatedEndAt: v.optional(v.number()),
    status: closureStatusValidator,
    closedBy: v.id("profiles"),
    closedAt: v.number(),
    reopenedBy: v.optional(v.id("profiles")),
    reopenedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_facility_status", ["facilityId", "status"])
    .index("by_status", ["status"]),

  // In-app notifications. dedupKey makes scheduled/retried jobs idempotent;
  // owner-only access is enforced in convex/notifications.ts.
  notifications: defineTable({
    userId: v.id("profiles"),
    type: notificationTypeValidator,
    title: v.string(),
    body: v.string(),
    reservationId: v.optional(v.id("reservations")),
    facilityId: v.optional(v.id("facilities")),
    issueId: v.optional(v.id("facilityIssues")),
    changeId: v.optional(v.id("reservationChanges")),
    closureId: v.optional(v.id("emergencyClosures")),
    readAt: v.optional(v.number()),
    dedupKey: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_dedup_key", ["dedupKey"]),

  auditEvents: defineTable({
    entityType: auditEntityValidator,
    entityId: v.string(),
    action: v.string(),
    fromStatus: v.optional(v.string()),
    toStatus: v.optional(v.string()),
    actorId: v.optional(v.id("profiles")),
    actorRole: actorRoleValidator,
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_actor", ["actorId"])
    .index("by_created", ["createdAt"]),
})
