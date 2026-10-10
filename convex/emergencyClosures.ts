import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import { recordAuditEvent } from "./lib/audit"
import { requireRole } from "./lib/authz"
import { jakartaRange, notify } from "./lib/notifications"
import { closureStatusValidator } from "./lib/validators"

const closureModeValidator = v.union(v.literal("safety"), v.literal("long_repair"))

const activeClosureValidator = v.object({
  id: v.id("emergencyClosures"),
  facilityId: v.id("facilities"),
  reason: v.string(),
  estimatedEndAt: v.optional(v.number()),
  closedAt: v.number(),
})

const managedClosureValidator = v.object({
  id: v.id("emergencyClosures"),
  facilityId: v.id("facilities"),
  facilityName: v.string(),
  reason: v.string(),
  estimatedEndAt: v.optional(v.number()),
  status: closureStatusValidator,
  closedByName: v.string(),
  closedAt: v.number(),
  reopenedAt: v.optional(v.number()),
  createdAt: v.number(),
})

async function futureReservations(ctx: MutationCtx, facilityId: Id<"facilities">) {
  const now = Date.now()
  const out = []
  for (const status of ["pending", "approved"] as const) {
    const rows = await ctx.db
      .query("reservations")
      .withIndex("by_facility_status_start", (q) =>
        q.eq("facilityId", facilityId).eq("status", status)
      )
      .collect()
    for (const row of rows) {
      if (row.endAt > now) out.push(row)
    }
  }
  return out
}

async function cancelPendingChanges(ctx: MutationCtx, reservationId: Id<"reservations">, note: string) {
  const changes = await ctx.db
    .query("reservationChanges")
    .withIndex("by_reservation_status", (q) =>
      q.eq("reservationId", reservationId).eq("status", "pending")
    )
    .collect()
  for (const change of changes) {
    await ctx.db.patch("reservationChanges", change._id, {
      status: "cancelled",
      decisionNote: note,
      updatedAt: Date.now(),
    })
  }
}

/** Public banner: reason + estimate text only, no actor identity. */
export const listActiveForFacility = query({
  args: { facilityId: v.id("facilities") },
  returns: v.array(activeClosureValidator),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("emergencyClosures")
      .withIndex("by_facility_status", (q) =>
        q.eq("facilityId", args.facilityId).eq("status", "closed")
      )
      .collect()
    return rows.map((row) => ({
      id: row._id,
      facilityId: row.facilityId,
      reason: row.reason,
      estimatedEndAt: row.estimatedEndAt,
      closedAt: row.closedAt,
    }))
  },
})

export const listManaged = query({
  args: {},
  returns: v.array(managedClosureValidator),
  handler: async (ctx) => {
    await requireRole(ctx, ["officer", "admin"])
    const rows = await ctx.db.query("emergencyClosures").order("desc").collect()
    return Promise.all(
      rows.slice(0, 100).map(async (row) => ({
        id: row._id,
        facilityId: row.facilityId,
        facilityName:
          (await ctx.db.get("facilities", row.facilityId))?.name ?? "Fasilitas dihapus",
        reason: row.reason,
        estimatedEndAt: row.estimatedEndAt,
        status: row.status,
        closedByName:
          (await ctx.db.get("profiles", row.closedBy))?.name ?? "Petugas",
        closedAt: row.closedAt,
        reopenedAt: row.reopenedAt,
        createdAt: row.createdAt,
      }))
    )
  },
})

/** Read-only impact preview before closing. */
export const previewImpact = query({
  args: { facilityId: v.id("facilities") },
  returns: v.object({
    pending: v.array(v.object({ id: v.id("reservations"), startAt: v.number(), endAt: v.number() })),
    approvedFuture: v.array(v.object({ id: v.id("reservations"), startAt: v.number(), endAt: v.number() })),
    ongoing: v.array(v.object({ id: v.id("reservations"), startAt: v.number(), endAt: v.number() })),
  }),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["officer", "admin"])
    const now = Date.now()
    const pending: { id: Id<"reservations">; startAt: number; endAt: number }[] = []
    const approvedFuture: { id: Id<"reservations">; startAt: number; endAt: number }[] = []
    const ongoing: { id: Id<"reservations">; startAt: number; endAt: number }[] = []
    for (const status of ["pending", "approved"] as const) {
      const rows = await ctx.db
        .query("reservations")
        .withIndex("by_facility_status_start", (q) =>
          q.eq("facilityId", args.facilityId).eq("status", status)
        )
        .collect()
      for (const row of rows) {
        if (row.endAt <= now) continue
        const item = { id: row._id, startAt: row.startAt, endAt: row.endAt }
        if (row.startAt <= now && row.endAt > now) ongoing.push(item)
        else if (status === "pending") pending.push(item)
        else approvedFuture.push(item)
      }
    }
    return { pending, approvedFuture, ongoing }
  },
})

export const close = mutation({
  args: {
    facilityId: v.id("facilities"),
    reason: v.string(),
    estimatedEndAt: v.optional(v.number()),
    reportId: v.optional(v.id("reports")),
    mode: closureModeValidator,
  },
  returns: v.id("emergencyClosures"),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const facility = await ctx.db.get("facilities", args.facilityId)
    if (!facility || facility.status === "inactive")
      throw new ConvexError("Fasilitas tidak ditemukan atau nonaktif")
    const reason = args.reason.trim()
    if (!reason) throw new ConvexError("Alasan penutupan wajib diisi")
    if (args.reportId) {
      const report = await ctx.db.get("reports", args.reportId)
      if (!report || report.facilityId !== facility._id)
        throw new ConvexError("Laporan tidak cocok dengan fasilitas ini")
    }
    const existing = await ctx.db
      .query("emergencyClosures")
      .withIndex("by_facility_status", (q) =>
        q.eq("facilityId", facility._id).eq("status", "closed")
      )
      .first()
    if (existing) throw new ConvexError("Fasilitas ini sudah ditutup darurat")

    const now = Date.now()
    const closureId = await ctx.db.insert("emergencyClosures", {
      facilityId: facility._id,
      reportId: args.reportId,
      reason,
      estimatedEndAt: args.estimatedEndAt,
      status: "closed",
      closedBy: actor._id,
      closedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    await recordAuditEvent(ctx, {
      entityType: "closure",
      entityId: closureId,
      action: "closure.closed",
      toStatus: "closed",
      actorId: actor._id,
      actorRole: actor.role,
      note: `${args.mode}: ${reason}`,
    })

    // Recompute impact at execution time; preview may be stale.
    const affected = await futureReservations(ctx, facility._id)
    const estimateText =
      args.estimatedEndAt === undefined
        ? "sampai pemberitahuan lebih lanjut"
        : `perkiraan sampai ${jakartaRange(now, args.estimatedEndAt)}`

    if (args.mode === "safety") {
      for (const row of affected) {
        await ctx.db.patch("reservations", row._id, {
          status: "cancelled",
          decisionNote: `Dibatalkan pengelola karena penutupan darurat: ${reason}`,
          cancelledBy: actor._id,
          cancelledAt: now,
          updatedAt: now,
        })
        await recordAuditEvent(ctx, {
          entityType: "reservation",
          entityId: row._id,
          action: "reservation.cancelled_by_staff",
          fromStatus: row.status,
          toStatus: "cancelled",
          actorId: actor._id,
          actorRole: actor.role,
          note: `closure:${closureId}`,
        })
        await notify(ctx, {
          userId: row.userId,
          type: "emergency.closed",
          title: `Reservasi dibatalkan: ${facility.name} ditutup darurat`,
          body: `Reservasi pada ${jakartaRange(row.startAt, row.endAt)} dibatalkan pengelola. Alasan: ${reason}.`,
          reservationId: row._id,
          facilityId: facility._id,
          closureId,
          dedupKey: `closure:${closureId}:reservation:${row._id}`,
        })
        await cancelPendingChanges(ctx, row._id, "Reservasi asal dibatalkan karena penutupan darurat.")
      }
    } else {
      // Long repair without estimate: block new bookings via closure row,
      // notify existing holders with a choice instead of auto-cancelling.
      const seen = new Set<string>()
      for (const row of affected) {
        const key = row.userId as string
        if (seen.has(key)) continue
        seen.add(key)
        await notify(ctx, {
          userId: row.userId,
          type: "emergency.closed",
          title: `Perbaikan besar di ${facility.name}`,
          body: `Sedang ada perbaikan ${estimateText}. Reservasi Anda pada ${jakartaRange(row.startAt, row.endAt)} dapat dibatalkan atau tetap menunggu. Booking baru ditutup sementara.`,
          reservationId: row._id,
          facilityId: facility._id,
          closureId,
          dedupKey: `closure:${closureId}:notice:user:${key}`,
        })
      }
    }
    return closureId
  },
})

export const reopen = mutation({
  args: { closureId: v.id("emergencyClosures"), confirmSafe: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const closure = await ctx.db.get("emergencyClosures", args.closureId)
    if (!closure || closure.status !== "closed")
      throw new ConvexError("Penutupan tidak aktif")
    if (!args.confirmSafe)
      throw new ConvexError("Konfirmasi bahwa fasilitas aman wajib dicentang")
    const now = Date.now()
    await ctx.db.patch("emergencyClosures", closure._id, {
      status: "reopened",
      reopenedBy: actor._id,
      reopenedAt: now,
      updatedAt: now,
    })
    await recordAuditEvent(ctx, {
      entityType: "closure",
      entityId: closure._id,
      action: "closure.reopened",
      fromStatus: "closed",
      toStatus: "reopened",
      actorId: actor._id,
      actorRole: actor.role,
      note: "Fasilitas dinyatakan aman",
    })
    return null
  },
})

/** User cancels their own booking due to an active closure (no 1h limit). */
export const cancelMineForClosure = mutation({
  args: {
    reservationId: v.id("reservations"),
    closureId: v.id("emergencyClosures"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["user"])
    const reservation = await ctx.db.get("reservations", args.reservationId)
    if (!reservation || reservation.userId !== profile._id)
      throw new ConvexError("Reservasi tidak ditemukan")
    if (reservation.status !== "pending" && reservation.status !== "approved")
      throw new ConvexError("Reservasi ini tidak dapat dibatalkan")
    if (reservation.endAt <= Date.now())
      throw new ConvexError("Reservasi ini tidak dapat dibatalkan")
    const closure = await ctx.db.get("emergencyClosures", args.closureId)
    if (!closure || closure.status !== "closed" || closure.facilityId !== reservation.facilityId)
      throw new ConvexError("Penutupan tidak berlaku untuk reservasi ini")
    if (reservation.status === "approved" && reservation.startAt <= Date.now())
      throw new ConvexError("Kegiatan sudah berlangsung. Hubungi petugas.")
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
      note: `closure:${closure._id}`,
    })
    const changes = await ctx.db
      .query("reservationChanges")
      .withIndex("by_reservation_status", (q) =>
        q.eq("reservationId", reservation._id).eq("status", "pending")
      )
      .collect()
    for (const change of changes) {
      await ctx.db.patch("reservationChanges", change._id, {
        status: "cancelled",
        decisionNote: "Reservasi asal dibatalkan.",
        updatedAt: now,
      })
    }
    return null
  },
})
