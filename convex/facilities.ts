import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { recordAuditEvent } from "./lib/audit"
import { requireRole } from "./lib/authz"
import {
  facilityStatusValidator,
  reservationStatusValidator,
} from "./lib/validators"

const publicFacilityValidator = v.object({
  id: v.id("facilities"),
  name: v.string(),
  type: v.string(),
  location: v.string(),
  capacity: v.number(),
  description: v.string(),
  status: facilityStatusValidator,
  createdAt: v.number(),
})

const managedFacilityValidator = v.object({
  id: v.id("facilities"),
  name: v.string(),
  type: v.string(),
  location: v.string(),
  capacity: v.number(),
  description: v.string(),
  status: facilityStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const listPublic = query({
  args: {},
  returns: v.array(publicFacilityValidator),
  handler: async (ctx) => {
    const [active, maintenance] = await Promise.all([
      ctx.db
        .query("facilities")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect(),
      ctx.db
        .query("facilities")
        .withIndex("by_status", (q) => q.eq("status", "maintenance"))
        .collect(),
    ])

    return [...active, ...maintenance]
      .sort((a, b) => a.name.localeCompare(b.name, "id"))
      .map((facility) => ({
        id: facility._id,
        name: facility.name,
        type: facility.type,
        location: facility.location,
        capacity: facility.capacity,
        description: facility.description,
        status: facility.status,
        createdAt: facility.createdAt,
      }))
  },
})

export const getPublicAvailability = query({
  args: {
    facilityId: v.id("facilities"),
    rangeStart: v.number(),
    rangeEnd: v.number(),
  },
  returns: v.object({
    facilityStatus: facilityStatusValidator,
    reservations: v.array(
      v.object({
        startAt: v.number(),
        endAt: v.number(),
        status: reservationStatusValidator,
      })
    ),
  }),
  handler: async (ctx, args) => {
    const facility = await ctx.db.get("facilities", args.facilityId)

    if (!facility || facility.status === "inactive") {
      throw new ConvexError("Fasilitas tidak ditemukan")
    }

    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_facility_status_start", (q) =>
        q
          .eq("facilityId", args.facilityId)
          .eq("status", "approved")
          .lt("startAt", args.rangeEnd)
      )
      .collect()

    return {
      facilityStatus: facility.status,
      reservations: reservations
        .filter((reservation) => reservation.endAt > args.rangeStart)
        .map((reservation) => ({
          startAt: reservation.startAt,
          endAt: reservation.endAt,
          status: reservation.status,
        })),
    }
  },
})

export const listManaged = query({
  args: {},
  returns: v.array(managedFacilityValidator),
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"])
    const facilities = await ctx.db.query("facilities").collect()

    return facilities
      .sort((a, b) => a.name.localeCompare(b.name, "id"))
      .map((facility) => ({
        id: facility._id,
        name: facility.name,
        type: facility.type,
        location: facility.location,
        capacity: facility.capacity,
        description: facility.description,
        status: facility.status,
        createdAt: facility.createdAt,
        updatedAt: facility.updatedAt,
      }))
  },
})

function validateFacilityInput(input: {
  name: string
  type: string
  location: string
  capacity: number
  description: string
}) {
  if (
    !input.name.trim() ||
    !input.type.trim() ||
    !input.location.trim() ||
    !input.description.trim()
  ) {
    throw new ConvexError("Semua data fasilitas wajib diisi")
  }

  if (!Number.isInteger(input.capacity) || input.capacity < 1) {
    throw new ConvexError("Kapasitas fasilitas minimal 1 orang")
  }
}

const facilityInput = {
  name: v.string(),
  type: v.string(),
  location: v.string(),
  capacity: v.number(),
  description: v.string(),
}

export const create = mutation({
  args: facilityInput,
  returns: v.id("facilities"),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin"])
    validateFacilityInput(args)
    const now = Date.now()
    const id = await ctx.db.insert("facilities", {
      name: args.name.trim(),
      type: args.type.trim(),
      location: args.location.trim(),
      capacity: args.capacity,
      description: args.description.trim(),
      status: "active",
      createdBy: actor._id,
      createdAt: now,
      updatedAt: now,
    })

    await recordAuditEvent(ctx, {
      entityType: "facility",
      entityId: id,
      action: "facility.created",
      toStatus: "active",
      actorId: actor._id,
      actorRole: actor.role,
    })

    return id
  },
})

export const update = mutation({
  args: { facilityId: v.id("facilities"), ...facilityInput },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin"])
    const facility = await ctx.db.get("facilities", args.facilityId)

    if (!facility) {
      throw new ConvexError("Fasilitas tidak ditemukan")
    }

    validateFacilityInput(args)
    await ctx.db.patch("facilities", facility._id, {
      name: args.name.trim(),
      type: args.type.trim(),
      location: args.location.trim(),
      capacity: args.capacity,
      description: args.description.trim(),
      updatedAt: Date.now(),
    })

    await recordAuditEvent(ctx, {
      entityType: "facility",
      entityId: facility._id,
      action: "facility.updated",
      actorId: actor._id,
      actorRole: actor.role,
    })

    return null
  },
})

export const setStatus = mutation({
  args: {
    facilityId: v.id("facilities"),
    status: facilityStatusValidator,
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin"])
    const facility = await ctx.db.get("facilities", args.facilityId)

    if (!facility) {
      throw new ConvexError("Fasilitas tidak ditemukan")
    }

    await ctx.db.patch("facilities", facility._id, {
      status: args.status,
      updatedAt: Date.now(),
    })

    await recordAuditEvent(ctx, {
      entityType: "facility",
      entityId: facility._id,
      action: "facility.status_changed",
      fromStatus: facility.status,
      toStatus: args.status,
      actorId: actor._id,
      actorRole: actor.role,
      note: args.note?.trim() || undefined,
    })

    return null
  },
})

export const remove = mutation({
  args: { facilityId: v.id("facilities") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin"])
    const facility = await ctx.db.get("facilities", args.facilityId)

    if (!facility) {
      throw new ConvexError("Fasilitas tidak ditemukan")
    }

    const [
      pendingReservation,
      approvedReservation,
      pendingReport,
      activeReport,
    ] = await Promise.all([
      ctx.db
        .query("reservations")
        .withIndex("by_facility_status_start", (q) =>
          q.eq("facilityId", facility._id).eq("status", "pending")
        )
        .first(),
      ctx.db
        .query("reservations")
        .withIndex("by_facility_status_start", (q) =>
          q.eq("facilityId", facility._id).eq("status", "approved")
        )
        .first(),
      ctx.db
        .query("reports")
        .withIndex("by_facility_and_status", (q) =>
          q.eq("facilityId", facility._id).eq("status", "pending")
        )
        .first(),
      ctx.db
        .query("reports")
        .withIndex("by_facility_and_status", (q) =>
          q.eq("facilityId", facility._id).eq("status", "in_progress")
        )
        .first(),
    ])

    if (
      pendingReservation ||
      approvedReservation ||
      pendingReport ||
      activeReport
    ) {
      throw new ConvexError(
        "Fasilitas masih memiliki reservasi aktif atau laporan yang belum selesai. Selesaikan data tersebut atau gunakan Sembunyikan."
      )
    }

    await ctx.db.delete("facilities", facility._id)

    await recordAuditEvent(ctx, {
      entityType: "facility",
      entityId: facility._id,
      action: "facility.deleted",
      fromStatus: facility.status,
      actorId: actor._id,
      actorRole: actor.role,
    })

    return null
  },
})
