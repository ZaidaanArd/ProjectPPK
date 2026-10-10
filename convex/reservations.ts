import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { maintenanceIn } from "./maintenance"
import { recordAuditEvent } from "./lib/audit"
import { requireActiveProfile, requireRole } from "./lib/authz"
import { facilityHandling } from "./lib/facilityHandling"
import { jakartaRange, notify } from "./lib/notifications"
import {
  AUTO_REJECTION_NOTE,
  overlaps,
  validateReservationWindow,
} from "./lib/reservationTime"
import { assertNoMaintenanceOverlap } from "./lib/maintenance"
import { reservationStatusValidator } from "./lib/validators"
import { assertFacilityCanApprove } from "./lib/workflows"
import {
  changeDeadline,
  effectiveReservationStatus,
  EXPIRATION_NOTE,
} from "./lib/reservationState"

const reservationListItemValidator = v.object({
  id: v.id("reservations"),
  facilityId: v.id("facilities"),
  facilityName: v.string(),
  facilityLocation: v.string(),
  facilityHandlingNotice: v.optional(v.string()),
  purpose: v.string(),
  startAt: v.number(),
  endAt: v.number(),
  status: reservationStatusValidator,
  decisionNote: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

async function approvedConflict(
  ctx: QueryCtx | MutationCtx,
  facilityId: Id<"facilities">,
  startAt: number,
  endAt: number,
  excludeId?: Id<"reservations">
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
  return approved.some(
    (item) =>
      item._id !== excludeId &&
      overlaps(item.startAt, item.endAt, startAt, endAt)
  )
}

async function rejectChangeConflicts(
  ctx: MutationCtx,
  facilityId: Id<"facilities">,
  startAt: number,
  endAt: number,
  now: number,
  excludeId?: Id<"reservationChanges">
) {
  const changes = await ctx.db
    .query("reservationChanges")
    .withIndex("by_facility_status_start", (q) =>
      q
        .eq("facilityId", facilityId)
        .eq("status", "pending")
        .lt("startAt", endAt)
    )
    .collect()
  for (const change of changes) {
    if (
      change._id === excludeId ||
      changeDeadline(change) <= now ||
      !overlaps(change.startAt, change.endAt, startAt, endAt)
    )
      continue
    await ctx.db.patch("reservationChanges", change._id, {
      status: "rejected",
      decisionNote:
        "Jadwal baru sudah disetujui untuk reservasi lain. Jadwal lama tetap berlaku.",
      updatedAt: now,
    })
    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: change.reservationId,
      action: "reservation.change_rejected_conflict",
      actorRole: "system",
      note: change._id,
    })
    await notify(ctx, {
      userId: change.userId,
      type: "reservation.change_conflict",
      title: "Perubahan jadwal ditolak otomatis",
      body: "Jadwal baru sudah disetujui untuk reservasi lain. Jadwal lama Anda tetap berlaku.",
      reservationId: change.reservationId,
      changeId: change._id,
      dedupKey: `reservationChange:${change._id}:conflict`,
    })
  }
}

async function cancelPendingChanges(
  ctx: MutationCtx,
  reservationId: Id<"reservations">,
  now: number
) {
  const changes = await ctx.db
    .query("reservationChanges")
    .withIndex("by_reservation_status", (q) =>
      q.eq("reservationId", reservationId).eq("status", "pending")
    )
    .collect()
  for (const change of changes)
    await ctx.db.patch("reservationChanges", change._id, {
      status: "cancelled",
      decisionNote: "Reservasi asal dibatalkan.",
      updatedAt: now,
    })
}

async function autoReject(
  ctx: MutationCtx,
  reservationId: Id<"reservations">,
  now: number
) {
  const item = await ctx.db.get("reservations", reservationId)
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
  if (item) {
    await notify(ctx, {
      userId: item.userId,
      type: "reservation.rejected",
      title: "Pengajuan ditolak otomatis",
      body: `${AUTO_REJECTION_NOTE} Pengajuan tetap dapat diajukan ulang untuk jadwal lain.`,
      reservationId,
      dedupKey: `reservation:${reservationId}:auto_rejected`,
    })
  }
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
          facilityHandlingNotice:
            facility && reservation.endAt > Date.now()
              ? (await facilityHandling(ctx, facility)).handlingNotice
              : undefined,
          purpose: reservation.purpose,
          startAt: reservation.startAt,
          endAt: reservation.endAt,
          status: effectiveReservationStatus(reservation, Date.now()),
          decisionNote: reservation.decisionNote,
          createdAt: reservation.createdAt,
          updatedAt: reservation.updatedAt,
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
          status: effectiveReservationStatus(reservation, Date.now()),
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

    if (
      !facility ||
      (await facilityHandling(ctx, facility)).status !== "active"
    ) {
      throw new ConvexError("Fasilitas sedang tidak dapat dipesan")
    }

    if (!args.purpose.trim()) {
      throw new ConvexError("Tujuan penggunaan wajib diisi")
    }

    validateReservationWindow(args.startAt, args.endAt)

    if (args.startAt <= Date.now()) {
      throw new ConvexError("Waktu reservasi harus berada di masa mendatang")
    }

    const mine = await ctx.db
      .query("reservations")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()
    const duplicate = mine.find(
      (item) =>
        item.facilityId === facility._id &&
        item.startAt === args.startAt &&
        item.endAt === args.endAt &&
        ["pending", "approved"].includes(item.status)
    )
    // An exact retry returns the existing request instead of creating another row.
    if (duplicate) return duplicate._id

    if (await approvedConflict(ctx, facility._id, args.startAt, args.endAt)) {
      throw new ConvexError("Slot sudah digunakan oleh reservasi lain")
    }

    assertNoMaintenanceOverlap(
      args,
      await maintenanceIn(ctx, facility._id, args.startAt, args.endAt)
    )

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
    await ctx.scheduler.runAt(args.startAt, internal.reservations.expire, {
      reservationId: id,
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

// Safe to retry. Approval/cancellation racing this job is handled by Convex OCC.
export const expire = internalMutation({
  args: { reservationId: v.id("reservations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get("reservations", args.reservationId)
    if (!item || item.status !== "pending" || item.startAt > Date.now())
      return null
    await ctx.db.patch("reservations", item._id, {
      status: "expired",
      decisionNote: EXPIRATION_NOTE,
      updatedAt: Date.now(),
    })
    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: item._id,
      action: "reservation.expired",
      fromStatus: "pending",
      toStatus: "expired",
      actorRole: "system",
      note: EXPIRATION_NOTE,
    })
    await notify(ctx, {
      userId: item.userId,
      type: "reservation.expired",
      title: "Pengajuan kedaluwarsa",
      body: `${EXPIRATION_NOTE} Silakan ajukan ulang dengan jadwal baru bila masih diperlukan.`,
      reservationId: item._id,
      dedupKey: `reservation:${item._id}:expired`,
    })
    return null
  },
})

// Legacy rows are previewed only; no bulk production cleanup is automatic.
export const previewExpiredPending = internalQuery({
  args: { cursor: v.optional(v.string()) },
  returns: v.object({
    scanned: v.number(),
    affectedIds: v.array(v.id("reservations")),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("reservations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .paginate({ cursor: args.cursor ?? null, numItems: 100 })
    return {
      scanned: page.page.length,
      affectedIds: page.page
        .filter((item) => item.startAt <= Date.now())
        .map((item) => item._id),
      nextCursor: page.isDone ? null : page.continueCursor,
    }
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
    await cancelPendingChanges(ctx, reservation._id, now)

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

    if (reservation.startAt <= Date.now()) {
      throw new ConvexError(
        "Pengajuan kedaluwarsa. Waktu mulai sudah lewat; minta pemohon mengajukan jadwal baru."
      )
    }

    if (args.decision === "approved") {
      const facility = await ctx.db.get("facilities", reservation.facilityId)

      if (!facility) {
        throw new ConvexError("Fasilitas reservasi tidak ditemukan")
      }

      assertFacilityCanApprove((await facilityHandling(ctx, facility)).status)
      assertNoMaintenanceOverlap(
        reservation,
        await maintenanceIn(
          ctx,
          reservation.facilityId,
          reservation.startAt,
          reservation.endAt
        )
      )

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

    const facility = await ctx.db.get("facilities", reservation.facilityId)
    const facilityName = facility?.name ?? "Fasilitas"
    const range = jakartaRange(reservation.startAt, reservation.endAt)
    if (args.decision === "approved") {
      await notify(ctx, {
        userId: reservation.userId,
        type: "reservation.approved",
        title: "Reservasi disetujui",
        body: `Reservasi ${facilityName} pada ${range} disetujui. Datang tepat waktu sesuai jadwal.`,
        reservationId: reservation._id,
        facilityId: reservation.facilityId,
        dedupKey: `reservation:${reservation._id}:approved`,
      })
    } else {
      const note = args.note?.trim()
      await notify(ctx, {
        userId: reservation.userId,
        type: "reservation.rejected",
        title: "Reservasi ditolak",
        body: note
          ? `Reservasi ${facilityName} pada ${range} ditolak. Alasan: ${note}.`
          : `Reservasi ${facilityName} pada ${range} ditolak petugas.`,
        reservationId: reservation._id,
        facilityId: reservation.facilityId,
        dedupKey: `reservation:${reservation._id}:rejected`,
      })
    }

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
      await rejectChangeConflicts(
        ctx,
        reservation.facilityId,
        reservation.startAt,
        reservation.endAt,
        now
      )
    }

    return null
  },
})

// Preview with previewPendingConflicts before considering this migration in production.
export const previewPendingConflicts = internalQuery({
  args: { cursor: v.optional(v.string()) },
  returns: v.object({
    scanned: v.number(),
    affectedIds: v.array(v.id("reservations")),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("reservations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .paginate({ cursor: args.cursor ?? null, numItems: 100 })
    const affectedIds: Id<"reservations">[] = []
    for (const item of page.page) {
      if (
        await approvedConflict(ctx, item.facilityId, item.startAt, item.endAt)
      ) {
        affectedIds.push(item._id)
      }
    }
    return {
      scanned: page.page.length,
      affectedIds,
      nextCursor: page.isDone ? null : page.continueCursor,
    }
  },
})

// Run only after an approved read-only preview of affected production reservations.
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

const scheduleChangeItem = v.object({
  id: v.id("reservationChanges"),
  reservationId: v.id("reservations"),
  facilityId: v.id("facilities"),
  facilityName: v.string(),
  applicantName: v.string(),
  originalStartAt: v.number(),
  originalEndAt: v.number(),
  startAt: v.number(),
  endAt: v.number(),
  reason: v.string(),
  status: reservationStatusValidator,
  decisionNote: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const listScheduleChanges = query({
  args: {},
  returns: v.array(scheduleChangeItem),
  handler: async (ctx) => {
    const actor = await requireActiveProfile(ctx)
    const items =
      actor.role === "user"
        ? await ctx.db
            .query("reservationChanges")
            .withIndex("by_user", (q) => q.eq("userId", actor._id))
            .order("desc")
            .collect()
        : await ctx.db.query("reservationChanges").order("desc").collect()
    return Promise.all(
      items.map(async (item) => ({
        id: item._id,
        reservationId: item.reservationId,
        facilityId: item.facilityId,
        facilityName:
          (await ctx.db.get("facilities", item.facilityId))?.name ??
          "Fasilitas dihapus",
        applicantName:
          (await ctx.db.get("profiles", item.userId))?.name ??
          "Pengguna dihapus",
        originalStartAt: item.originalStartAt,
        originalEndAt: item.originalEndAt,
        startAt: item.startAt,
        endAt: item.endAt,
        reason: item.reason,
        status:
          item.status === "pending" && changeDeadline(item) <= Date.now()
            ? ("expired" as const)
            : item.status,
        decisionNote: item.decisionNote,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
    )
  },
})

export const requestScheduleChange = mutation({
  args: {
    reservationId: v.id("reservations"),
    startAt: v.number(),
    endAt: v.number(),
    reason: v.string(),
  },
  returns: v.id("reservationChanges"),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["user"])
    const original = await ctx.db.get("reservations", args.reservationId)
    const now = Date.now()
    if (
      !original ||
      original.userId !== user._id ||
      original.status !== "approved" ||
      original.startAt <= now
    )
      throw new ConvexError(
        "Hanya reservasi disetujui yang belum dimulai dapat diubah"
      )
    validateReservationWindow(args.startAt, args.endAt)
    if (args.startAt <= now)
      throw new ConvexError("Jadwal baru harus di masa mendatang")
    if (args.startAt === original.startAt && args.endAt === original.endAt)
      throw new ConvexError("Pilih jadwal yang berbeda")
    if (!args.reason.trim())
      throw new ConvexError("Alasan perubahan wajib diisi")
    const previous = await ctx.db
      .query("reservationChanges")
      .withIndex("by_reservation_status", (q) =>
        q.eq("reservationId", original._id).eq("status", "pending")
      )
      .collect()
    if (previous.some((item) => changeDeadline(item) > now))
      throw new ConvexError(
        "Masih ada perubahan jadwal menunggu. Batalkan atau tunggu keputusan petugas."
      )
    const facility = await ctx.db.get("facilities", original.facilityId)
    if (!facility) throw new ConvexError("Fasilitas tidak ditemukan")
    assertFacilityCanApprove((await facilityHandling(ctx, facility)).status)
    assertNoMaintenanceOverlap(
      args,
      await maintenanceIn(ctx, original.facilityId, args.startAt, args.endAt)
    )
    if (
      await approvedConflict(
        ctx,
        original.facilityId,
        args.startAt,
        args.endAt,
        original._id
      )
    )
      throw new ConvexError("Slot sudah digunakan oleh reservasi lain")
    const item = {
      reservationId: original._id,
      userId: user._id,
      facilityId: original.facilityId,
      originalStartAt: original.startAt,
      originalEndAt: original.endAt,
      startAt: args.startAt,
      endAt: args.endAt,
      reason: args.reason.trim(),
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
    }
    const id = await ctx.db.insert("reservationChanges", item)
    await ctx.scheduler.runAt(
      changeDeadline(item),
      internal.reservations.expireScheduleChange,
      { changeId: id }
    )
    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: original._id,
      action: "reservation.change_requested",
      actorId: user._id,
      actorRole: user.role,
      note: `${id}: ${args.startAt}–${args.endAt}; ${item.reason}`,
    })
    return id
  },
})

export const cancelScheduleChange = mutation({
  args: { changeId: v.id("reservationChanges") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["user"])
    const change = await ctx.db.get("reservationChanges", args.changeId)
    if (!change || change.userId !== user._id)
      throw new ConvexError("Perubahan jadwal tidak ditemukan")
    if (change.status === "cancelled") return null
    if (change.status !== "pending" || changeDeadline(change) <= Date.now())
      throw new ConvexError("Perubahan jadwal sudah diproses atau kedaluwarsa")
    await ctx.db.patch("reservationChanges", change._id, {
      status: "cancelled",
      updatedAt: Date.now(),
    })
    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: change.reservationId,
      action: "reservation.change_cancelled",
      actorId: user._id,
      actorRole: user.role,
      note: change._id,
    })
    return null
  },
})

export const decideScheduleChange = mutation({
  args: {
    changeId: v.id("reservationChanges"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    note: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const change = await ctx.db.get("reservationChanges", args.changeId)
    const now = Date.now()
    if (!change || change.status !== "pending" || changeDeadline(change) <= now)
      throw new ConvexError("Perubahan jadwal sudah diproses atau kedaluwarsa")
    const original = await ctx.db.get("reservations", change.reservationId)
    if (
      !original ||
      original.status !== "approved" ||
      original.startAt !== change.originalStartAt ||
      original.endAt !== change.originalEndAt
    )
      throw new ConvexError("Reservasi asal telah berubah. Muat ulang antrean.")
    if (args.decision === "rejected" && !args.note?.trim())
      throw new ConvexError("Alasan penolakan wajib diisi")
    if (args.decision === "approved") {
      const facility = await ctx.db.get("facilities", change.facilityId)
      if (!facility) throw new ConvexError("Fasilitas tidak ditemukan")
      assertFacilityCanApprove((await facilityHandling(ctx, facility)).status)
      validateReservationWindow(change.startAt, change.endAt)
      assertNoMaintenanceOverlap(
        change,
        await maintenanceIn(
          ctx,
          change.facilityId,
          change.startAt,
          change.endAt
        )
      )
      if (
        await approvedConflict(
          ctx,
          change.facilityId,
          change.startAt,
          change.endAt,
          original._id
        )
      )
        throw new ConvexError(
          "Jadwal baru sudah terisi. Jadwal lama tetap berlaku."
        )
      await ctx.db.patch("reservations", original._id, {
        startAt: change.startAt,
        endAt: change.endAt,
        updatedAt: now,
      })
      await rejectChangeConflicts(
        ctx,
        change.facilityId,
        change.startAt,
        change.endAt,
        now,
        change._id
      )
      const pending = await ctx.db
        .query("reservations")
        .withIndex("by_facility_status_start", (q) =>
          q
            .eq("facilityId", change.facilityId)
            .eq("status", "pending")
            .lt("startAt", change.endAt)
        )
        .collect()
      for (const item of pending)
        if (overlaps(item.startAt, item.endAt, change.startAt, change.endAt))
          await autoReject(ctx, item._id, now)
    }
    await ctx.db.patch("reservationChanges", change._id, {
      status: args.decision,
      decisionNote: args.note?.trim() || undefined,
      decidedBy: actor._id,
      decidedAt: now,
      updatedAt: now,
    })
    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: original._id,
      action: `reservation.change_${args.decision}`,
      actorId: actor._id,
      actorRole: actor.role,
      note: `${change._id}: ${change.originalStartAt}–${change.originalEndAt} → ${change.startAt}–${change.endAt}; ${args.note?.trim() || change.reason}`,
    })
    if (args.decision === "approved") {
      await notify(ctx, {
        userId: change.userId,
        type: "reservation.change_decided",
        title: "Perubahan jadwal disetujui",
        body: `Jadwal reservasi sekarang ${jakartaRange(change.startAt, change.endAt)}. Jadwal lama tidak lagi terkunci.`,
        reservationId: original._id,
        facilityId: change.facilityId,
        changeId: change._id,
        dedupKey: `reservationChange:${change._id}:approved`,
      })
    } else {
      await notify(ctx, {
        userId: change.userId,
        type: "reservation.change_decided",
        title: "Perubahan jadwal ditolak",
        body: `Jadwal lama tetap berlaku pada ${jakartaRange(change.originalStartAt, change.originalEndAt)}. Alasan: ${args.note?.trim() || "-"}`,
        reservationId: original._id,
        facilityId: change.facilityId,
        changeId: change._id,
        dedupKey: `reservationChange:${change._id}:rejected`,
      })
    }
    return null
  },
})

export const expireScheduleChange = internalMutation({
  args: { changeId: v.id("reservationChanges") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get("reservationChanges", args.changeId)
    if (!item || item.status !== "pending" || changeDeadline(item) > Date.now())
      return null
    await ctx.db.patch("reservationChanges", item._id, {
      status: "expired",
      decisionNote: EXPIRATION_NOTE,
      updatedAt: Date.now(),
    })
    await recordAuditEvent(ctx, {
      entityType: "reservation",
      entityId: item.reservationId,
      action: "reservation.change_expired",
      actorRole: "system",
      note: item._id,
    })
    await notify(ctx, {
      userId: item.userId,
      type: "reservation.change_decided",
      title: "Perubahan jadwal kedaluwarsa",
      body: `${EXPIRATION_NOTE} Jadwal lama tetap berlaku pada ${jakartaRange(item.originalStartAt, item.originalEndAt)}.`,
      reservationId: item.reservationId,
      facilityId: item.facilityId,
      changeId: item._id,
      dedupKey: `reservationChange:${item._id}:expired`,
    })
    return null
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

    if (
      !reservation ||
      !["pending", "approved"].includes(
        effectiveReservationStatus(reservation, Date.now())
      ) ||
      reservation.endAt <= Date.now()
    ) {
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
    const facility = await ctx.db.get("facilities", reservation.facilityId)
    await notify(ctx, {
      userId: reservation.userId,
      type: "reservation.cancelled",
      title: "Reservasi dibatalkan pengelola",
      body: `Reservasi ${facility?.name ?? "fasilitas"} pada ${jakartaRange(reservation.startAt, reservation.endAt)} dibatalkan pengelola. Alasan: ${args.reason.trim()}.`,
      reservationId: reservation._id,
      facilityId: reservation.facilityId,
      dedupKey: `reservation:${reservation._id}:cancelled_by_staff`,
    })
    await cancelPendingChanges(ctx, reservation._id, now)

    return null
  },
})
