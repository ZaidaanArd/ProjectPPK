import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { internalMutation, mutation, query } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import { recordAuditEvent } from "./lib/audit"
import { requireActiveProfile, requireRole } from "./lib/authz"
import {
  AUTO_REJECTION_NOTE,
  overlaps,
  validateReservationWindow,
} from "./lib/reservationTime"
import { reservationStatusValidator } from "./lib/validators"
import { assertFacilityCanApprove } from "./lib/workflows"

const reservationListItemValidator = v.object({
  id: v.id("reservations"),
  facilityId: v.id("facilities"),
  facilityName: v.string(),
  facilityLocation: v.string(),
  purpose: v.string(),
  startAt: v.number(),
  endAt: v.number(),
  status: reservationStatusValidator,
  decisionNote: v.optional(v.string()),
  createdAt: v.number(),
})

async function approvedConflict(
  ctx: MutationCtx,
  facilityId: Id<"facilities">,
  startAt: number,
  endAt: number
) {
  const approved = await ctx.db
    .query("reservations")
    .withIndex("by_facility_status_start", (q) =>
      q
        .eq("facilityId", facilityId)
        .eq("status", "approved")
        .lt("startAt", endAt)
    )
    .collect()
  return approved.some((item) =>
    overlaps(item.startAt, item.endAt, startAt, endAt)
  )
}

async function autoReject(
  ctx: MutationCtx,
  reservationId: Id<"reservations">,
  now: number
) {
  await ctx.db.patch("reservations", reservationId, {
    status: "rejected",
    decisionNote: AUTO_REJECTION_NOTE,
    decidedAt: now,
    updatedAt: now,
  })
  await recordAuditEvent(ctx, {
    entityType: "reservation",
    entityId: reservationId,
    action: "reservation.auto_rejected_conflict",
    fromStatus: "pending",
    toStatus: "rejected",
    actorRole: "system",
    note: AUTO_REJECTION_NOTE,
  })
}

export const listMine = query({
  args: {},
  returns: v.array(reservationListItemValidator),
  handler: async (ctx) => {
    const profile = await requireActiveProfile(ctx)
    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .order("desc")
      .collect()

    return Promise.all(
      reservations.map(async (reservation) => {
        const facility = await ctx.db.get("facilities", reservation.facilityId)

        return {
          id: reservation._id,
          facilityId: reservation.facilityId,
          facilityName: facility?.name ?? "Fasilitas dihapus",
          facilityLocation: facility?.location ?? "-",
          purpose: reservation.purpose,
          startAt: reservation.startAt,
          endAt: reservation.endAt,
          status: reservation.status,
          decisionNote: reservation.decisionNote,
          createdAt: reservation.createdAt,
        }
      })
    )
  },
})

export const listQueue = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("reservations"),
      applicantName: v.string(),
      applicantEmail: v.string(),
      facilityName: v.string(),
      purpose: v.string(),
      startAt: v.number(),
      endAt: v.number(),
      status: reservationStatusValidator,
      decisionNote: v.optional(v.string()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    await requireRole(ctx, ["officer", "admin"])
    const reservations = await ctx.db
      .query("reservations")
      .order("desc")
      .collect()

    return Promise.all(
      reservations.map(async (reservation) => {
        const [facility, applicant] = await Promise.all([
          ctx.db.get("facilities", reservation.facilityId),
          ctx.db.get("profiles", reservation.userId),
        ])

        return {
          id: reservation._id,
          applicantName: applicant?.name ?? "Pengguna dihapus",
          applicantEmail: applicant?.email ?? "-",
          facilityName: facility?.name ?? "Fasilitas dihapus",
          purpose: reservation.purpose,
          startAt: reservation.startAt,
          endAt: reservation.endAt,
          status: reservation.status,
          decisionNote: reservation.decisionNote,
          createdAt: reservation.createdAt,
        }
      })
    )
  },
})

export const create = mutation({
  args: {
    facilityId: v.id("facilities"),
    purpose: v.string(),
    startAt: v.number(),
    endAt: v.number(),
  },
  returns: v.id("reservations"),
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["user"])
    const facility = await ctx.db.get("facilities", args.facilityId)

    if (!facility || facility.status !== "active") {
      throw new ConvexError("Fasilitas sedang tidak dapat dipesan")
    }

    if (!args.purpose.trim()) {
      throw new ConvexError("Tujuan penggunaan wajib diisi")
    }

    validateReservationWindow(args.startAt, args.endAt)

    if (args.startAt <= Date.now()) {
      throw new ConvexError("Waktu reservasi harus berada di masa mendatang")
    }

    if (await approvedConflict(ctx, facility._id, args.startAt, args.endAt)) {
      throw new ConvexError("Slot sudah digunakan oleh reservasi lain")
    }

    const now = Date.now()
    const id = await ctx.db.insert("reservations", {
      userId: profile._id,
      facilityId: facility._id,
      purpose: args.purpose.trim(),
      startAt: args.startAt,
      endAt: args.endAt,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })

    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: id,
      action: "reservation.created",
      toStatus: "pending",
      actorId: profile._id,
      actorRole: profile.role,
    })

    return id
  },
})

export const cancelMine = mutation({
  args: { reservationId: v.id("reservations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["user"])
    const reservation = await ctx.db.get("reservations", args.reservationId)

    if (!reservation || reservation.userId !== profile._id) {
      throw new ConvexError("Reservasi tidak ditemukan")
    }

    if (reservation.status !== "pending" && reservation.status !== "approved") {
      throw new ConvexError("Reservasi ini tidak dapat dibatalkan")
    }

    if (reservation.startAt - Date.now() < 60 * 60 * 1000) {
      throw new ConvexError(
        "Reservasi hanya dapat dibatalkan minimal 1 jam sebelumnya"
      )
    }

    const now = Date.now()
    await ctx.db.patch("reservations", reservation._id, {
      status: "cancelled",
      cancelledBy: profile._id,
      cancelledAt: now,
      updatedAt: now,
    })

    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: reservation._id,
      action: "reservation.cancelled_by_user",
      fromStatus: reservation.status,
      toStatus: "cancelled",
      actorId: profile._id,
      actorRole: profile.role,
    })

    return null
  },
})

export const decide = mutation({
  args: {
    reservationId: v.id("reservations"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const reservation = await ctx.db.get("reservations", args.reservationId)

    if (!reservation || reservation.status !== "pending") {
      throw new ConvexError("Reservasi tidak tersedia untuk diproses")
    }

    if (args.decision === "approved") {
      const facility = await ctx.db.get("facilities", reservation.facilityId)

      if (!facility) {
        throw new ConvexError("Fasilitas reservasi tidak ditemukan")
      }

      assertFacilityCanApprove(facility.status)

      if (
        await approvedConflict(
          ctx,
          reservation.facilityId,
          reservation.startAt,
          reservation.endAt
        )
      ) {
        await autoReject(ctx, reservation._id, Date.now())
        return null
      }
    }

    const now = Date.now()
    await ctx.db.patch("reservations", reservation._id, {
      status: args.decision,
      decisionNote: args.note?.trim() || undefined,
      decidedBy: actor._id,
      decidedAt: now,
      updatedAt: now,
    })

    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: reservation._id,
      action: `reservation.${args.decision}`,
      fromStatus: reservation.status,
      toStatus: args.decision,
      actorId: actor._id,
      actorRole: actor.role,
      note: args.note?.trim() || undefined,
    })

    if (args.decision === "approved") {
      const pending = await ctx.db
        .query("reservations")
        .withIndex("by_facility_status_start", (q) =>
          q
            .eq("facilityId", reservation.facilityId)
            .eq("status", "pending")
            .lt("startAt", reservation.endAt)
        )
        .collect()
      for (const item of pending) {
        if (
          item._id !== reservation._id &&
          overlaps(
            item.startAt,
            item.endAt,
            reservation.startAt,
            reservation.endAt
          )
        ) {
          await autoReject(ctx, item._id, now)
        }
      }
    }

    return null
  },
})

// Run once after deployment: pnpm exec convex run reservations:reconcilePendingConflicts '{}'
// Add --prod for the production deployment. Re-running is safe.
export const reconcilePendingConflicts = internalMutation({
  args: { cursor: v.optional(v.string()) },
  returns: v.object({
    scanned: v.number(),
    rejected: v.number(),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("reservations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .paginate({ cursor: args.cursor ?? null, numItems: 100 })
    let rejected = 0
    const now = Date.now()
    for (const item of page.page) {
      if (
        await approvedConflict(ctx, item.facilityId, item.startAt, item.endAt)
      ) {
        await autoReject(ctx, item._id, now)
        rejected++
      }
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.reservations.reconcilePendingConflicts,
        {
          cursor: page.continueCursor,
        }
      )
    }
    return { scanned: page.page.length, rejected, done: page.isDone }
  },
})

export const cancelByStaff = mutation({
  args: {
    reservationId: v.id("reservations"),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const reservation = await ctx.db.get("reservations", args.reservationId)

    if (!reservation || !["pending", "approved"].includes(reservation.status)) {
      throw new ConvexError("Reservasi tidak dapat dibatalkan")
    }

    if (!args.reason.trim()) {
      throw new ConvexError("Alasan pembatalan wajib diisi")
    }

    const now = Date.now()
    await ctx.db.patch("reservations", reservation._id, {
      status: "cancelled",
      decisionNote: args.reason.trim(),
      cancelledBy: actor._id,
      cancelledAt: now,
      updatedAt: now,
    })

    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: reservation._id,
      action: "reservation.cancelled_by_staff",
      fromStatus: reservation.status,
      toStatus: "cancelled",
      actorId: actor._id,
      actorRole: actor.role,
      note: args.reason.trim(),
    })

    return null
  },
})
