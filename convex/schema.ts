import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
  accountStatusValidator,
  actorRoleValidator,
  auditEntityValidator,
  facilityStatusValidator,
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

  reports: defineTable({
    reporterId: v.id("profiles"),
    facilityId: v.id("facilities"),
    category: v.string(),
    description: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    photoName: v.optional(v.string()),
    photoContentType: v.optional(v.string()),
    status: reportStatusValidator,
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
