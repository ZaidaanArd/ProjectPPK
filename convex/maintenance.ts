import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import { internalMutation, mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { recordAuditEvent } from "./lib/audit"
import { requireRole } from "./lib/authz"
import { jakartaRange, notify } from "./lib/notifications"
import {
  assertMaintenanceSlotFree,
  validateMaintenanceWindow,
  type TimeRange,
} from "./lib/maintenance"
import { maintenanceStatusValidator } from "./lib/validators"

type Ctx = QueryCtx | MutationCtx

/** Reservations of one status on a facility that overlap [startAt, endAt). */
async function reservationsIn(
  ctx: Ctx,
  facilityId: Id<"facilities">,
  status: "pending" | "approved",
  startAt: number,
  endAt: number
) {
  const rows = await ctx.db
    .query("reservations")
    .withIndex("by_facility_status_start", (q) =>
      q.eq("facilityId", facilityId).eq("status", status).lt("startAt", endAt)
    )
    .collect()
  return rows.filter((row) => row.endAt > startAt)
}

/** Scheduled maintenance windows on a facility that overlap [startAt, endAt). */
export async function maintenanceIn(
  ctx: Ctx,
  facilityId: Id<"facilities">,
  startAt: number,
  endAt: number
) {
  const rows = await ctx.db
    .query("maintenanceWindows")
    .withIndex("by_facility_status_start", (q) =>
      q
        .eq("facilityId", facilityId)
        .eq("status", "scheduled")
        .lt("startAt", endAt)
    )
    .collect()
  return rows.filter((row) => row.endAt > startAt)
}

async function assertFree(
  ctx: MutationCtx,
  facilityId: Id<"facilities">,
  range: TimeRange,
  ignoreWindowId?: Id<"maintenanceWindows">
) {
  const [approved, pending, maintenance] = await Promise.all([
    reservationsIn(ctx, facilityId, "approved", range.startAt, range.endAt),
    reservationsIn(ctx, facilityId, "pending", range.startAt, range.endAt),
    maintenanceIn(ctx, facilityId, range.startAt, range.endAt),
  ])
  assertMaintenanceSlotFree(range, {
    approved,
    pending,
    maintenance: maintenance.filter((row) => row._id !== ignoreWindowId),
  })
}

async function scheduleExpiry(
  ctx: MutationCtx,
  window: Doc<"maintenanceWindows">
) {
  await ctx.scheduler.runAt(window.endAt, internal.maintenance.expire, {
    windowId: window._id,
    endAt: window.endAt,
  })
  await scheduleReminder(ctx, window)
}

/** Reminder 30 min before end, shown in staff and admin portals. */
export const REMINDER_LEAD_MS = 30 * 60 * 1000

async function scheduleReminder(
  ctx: MutationCtx,
  window: Doc<"maintenanceWindows">
) {
  const remindAt = window.endAt - REMINDER_LEAD_MS
  if (remindAt <= Date.now()) return
  await ctx.scheduler.runAt(remindAt, internal.maintenance.remind, {
    windowId: window._id,
    endAt: window.endAt,
  })
}

async function requireScheduledWindow(
  ctx: MutationCtx,
  windowId: Id<"maintenanceWindows">
) {
  const window = await ctx.db.get("maintenanceWindows", windowId)
  if (!window || window.status !== "scheduled") {
    throw new ConvexError("Jadwal perbaikan tidak aktif")
  }
  return window
}

/**
 * Closes a window the way its time demands: one that has started is completed
 * now, one that has not started yet is cancelled. Used when staff end a window
 * and when the report it belongs to is closed.
 */
export async function closeWindow(
  ctx: MutationCtx,
  window: Doc<"maintenanceWindows">,
  actor: Doc<"profiles">,
  note?: string
) {
  const now = Date.now()
  const started = window.startAt <= now
  const status = started ? "completed" : "cancelled"
  await ctx.db.patch("maintenanceWindows", window._id, {
    status,
    ...(started ? { endAt: Math.min(window.endAt, now) } : {}),
    closedBy: actor._id,
    closedAt: now,
    updatedAt: now,
  })
  await recordAuditEvent(ctx, {
    entityType: "maintenance",
    entityId: window._id,
    action: `maintenance.${status}`,
    fromStatus: "scheduled",
    toStatus: status,
    actorId: actor._id,
    actorRole: actor.role,
    note,
  })
  return status
}

const windowItemValidator = v.object({
  id: v.id("maintenanceWindows"),
  facilityId: v.id("facilities"),
  facilityName: v.string(),
  reportId: v.optional(v.id("reports")),
  reportCategory: v.optional(v.string()),
  reason: v.string(),
  startAt: v.number(),
  endAt: v.number(),
  status: maintenanceStatusValidator,
  createdByName: v.string(),
  closedAt: v.optional(v.number()),
  updatedAt: v.number(),
})

/** Every scheduled window plus the 30 most recently closed ones, for staff. */
export const listManaged = query({
  args: {},
  returns: v.array(windowItemValidator),
  handler: async (ctx) => {
    await requireRole(ctx, ["officer", "admin"])
    const [scheduled, completed, cancelled] = await Promise.all([
      ctx.db
        .query("maintenanceWindows")
        .withIndex("by_status_start", (q) => q.eq("status", "scheduled"))
        .collect(),
      ctx.db
        .query("maintenanceWindows")
        .withIndex("by_status_start", (q) => q.eq("status", "completed"))
        .order("desc")
        .take(30),
      ctx.db
        .query("maintenanceWindows")
        .withIndex("by_status_start", (q) => q.eq("status", "cancelled"))
        .order("desc")
        .take(30),
    ])
    const closed = [...completed, ...cancelled]
      .sort((a, b) => (b.closedAt ?? b.updatedAt) - (a.closedAt ?? a.updatedAt))
      .slice(0, 30)

    return Promise.all(
      [...scheduled, ...closed].map(async (window) => {
        const [facility, report, creator] = await Promise.all([
          ctx.db.get("facilities", window.facilityId),
          window.reportId ? ctx.db.get("reports", window.reportId) : null,
          ctx.db.get("profiles", window.createdBy),
        ])
        return {
          id: window._id,
          facilityId: window.facilityId,
          facilityName: facility?.name ?? "Fasilitas dihapus",
          reportId: window.reportId,
          reportCategory: report?.category,
          reason: window.reason,
          startAt: window.startAt,
          endAt: window.endAt,
          status: window.status,
          createdByName: creator?.name ?? "Petugas",
          closedAt: window.closedAt,
          updatedAt: window.updatedAt,
        }
      })
    )
  },
})

/**
 * What already occupies a facility in a time range, so staff can pick a free
 * slot for a repair: approved and pending reservations and other windows.
 */
export const agenda = query({
  args: {
    facilityId: v.id("facilities"),
    rangeStart: v.number(),
    rangeEnd: v.number(),
  },
  returns: v.object({
    reservations: v.array(
      v.object({
        startAt: v.number(),
        endAt: v.number(),
        status: v.union(v.literal("pending"), v.literal("approved")),
      })
    ),
    maintenance: v.array(
      v.object({
        id: v.id("maintenanceWindows"),
        startAt: v.number(),
        endAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["officer", "admin"])
    const [approved, pending, maintenance] = await Promise.all([
      reservationsIn(
        ctx,
        args.facilityId,
        "approved",
        args.rangeStart,
        args.rangeEnd
      ),
      reservationsIn(
        ctx,
        args.facilityId,
        "pending",
        args.rangeStart,
        args.rangeEnd
      ),
      maintenanceIn(ctx, args.facilityId, args.rangeStart, args.rangeEnd),
    ])
    return {
      reservations: [...approved, ...pending].map((row) => ({
        startAt: row.startAt,
        endAt: row.endAt,
        status: row.status as "pending" | "approved",
      })),
      maintenance: maintenance.map((row) => ({
        id: row._id,
        startAt: row.startAt,
        endAt: row.endAt,
      })),
    }
  },
})

export const schedule = mutation({
  args: {
    facilityId: v.id("facilities"),
    startAt: v.number(),
    endAt: v.number(),
    reason: v.string(),
    reportId: v.optional(v.id("reports")),
  },
  returns: v.id("maintenanceWindows"),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const facility = await ctx.db.get("facilities", args.facilityId)
    if (!facility || facility.status === "inactive") {
      throw new ConvexError("Fasilitas tidak ditemukan atau nonaktif")
    }
    const reason = args.reason.trim()
    if (!reason) {
      throw new ConvexError("Alasan perbaikan wajib diisi")
    }
    if (args.reportId) {
      const report = await ctx.db.get("reports", args.reportId)
      if (!report || report.facilityId !== facility._id) {
        throw new ConvexError("Laporan tidak cocok dengan fasilitas ini")
      }
      if (report.status === "resolved" || report.status === "rejected") {
        throw new ConvexError("Laporan ini sudah ditutup")
      }
    }

    const now = Date.now()
    validateMaintenanceWindow(args.startAt, args.endAt, now)
    await assertFree(ctx, facility._id, args)

    const id = await ctx.db.insert("maintenanceWindows", {
      facilityId: facility._id,
      reportId: args.reportId,
      reason,
      startAt: args.startAt,
      endAt: args.endAt,
      status: "scheduled",
      createdBy: actor._id,
      createdAt: now,
      updatedAt: now,
    })
    const window = await ctx.db.get("maintenanceWindows", id)
    if (window) await scheduleExpiry(ctx, window)

    await recordAuditEvent(ctx, {
      entityType: "maintenance",
      entityId: id,
      action: "maintenance.scheduled",
      toStatus: "scheduled",
      actorId: actor._id,
      actorRole: actor.role,
      note: reason,
    })
    return id
  },
})

/** Moves a window's end later; only the added time has to be free. */
export const extend = mutation({
  args: {
    windowId: v.id("maintenanceWindows"),
    endAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const window = await requireScheduledWindow(ctx, args.windowId)
    if (args.endAt <= window.endAt) {
      throw new ConvexError(
        "Waktu selesai baru harus setelah waktu selesai sekarang. Gunakan Selesai untuk mengakhiri lebih cepat."
      )
    }
    validateMaintenanceWindow(window.startAt, args.endAt, Date.now())
    await assertFree(
      ctx,
      window.facilityId,
      { startAt: window.endAt, endAt: args.endAt },
      window._id
    )

    await ctx.db.patch("maintenanceWindows", window._id, {
      endAt: args.endAt,
      updatedAt: Date.now(),
    })
    await scheduleExpiry(ctx, { ...window, endAt: args.endAt })
    await recordAuditEvent(ctx, {
      entityType: "maintenance",
      entityId: window._id,
      action: "maintenance.extended",
      fromStatus: "scheduled",
      toStatus: "scheduled",
      actorId: actor._id,
      actorRole: actor.role,
    })
    return null
  },
})

/** Ends a started window now, or cancels one that has not started. */
export const close = mutation({
  args: { windowId: v.id("maintenanceWindows") },
  returns: v.union(v.literal("completed"), v.literal("cancelled")),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const window = await requireScheduledWindow(ctx, args.windowId)
    return closeWindow(ctx, window, actor)
  },
})

/**
 * Runs at a window's endAt. Does nothing if the window was closed or extended
 * since this run was scheduled (the extension schedules its own run).
 */
export const expire = internalMutation({  args: { windowId: v.id("maintenanceWindows"), endAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const window = await ctx.db.get("maintenanceWindows", args.windowId)
    if (
      !window ||
      window.status !== "scheduled" ||
      window.endAt !== args.endAt
    ) {
      return null
    }
    await ctx.db.patch("maintenanceWindows", window._id, {
      status: "completed",
      closedAt: Date.now(),
      updatedAt: Date.now(),
    })
    await recordAuditEvent(ctx, {
      entityType: "maintenance",
      entityId: window._id,
      action: "maintenance.completed_on_schedule",
      fromStatus: "scheduled",
      toStatus: "completed",
      actorRole: "system",
    })
    return null
  },
})

/**
 * Runs 30 min before a window ends. Idempotent per window+endAt; notifies the
 * creator so staff and admin portals can show Selesaikan/Perpanjang.
 */
export const remind = internalMutation({
  args: { windowId: v.id("maintenanceWindows"), endAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const window = await ctx.db.get("maintenanceWindows", args.windowId)
    if (!window || window.status !== "scheduled" || window.endAt !== args.endAt)
      return null
    const facility = await ctx.db.get("facilities", window.facilityId)
    await notify(ctx, {
      userId: window.createdBy,
      type: "maintenance.reminder",
      title: `Perbaikan hampir selesai di ${facility?.name ?? "fasilitas"}`,
      body: `Jadwal ${jakartaRange(window.startAt, window.endAt)} berakhir 30 menit lagi. Selesaikan atau perpanjang dari portal petugas/admin.`,
      facilityId: window.facilityId,
      dedupKey: `maintenance:${window._id}:reminder:${args.endAt}`,
    })
    await recordAuditEvent(ctx, {
      entityType: "maintenance",
      entityId: window._id,
      action: "maintenance.reminder_sent",
      fromStatus: "scheduled",
      toStatus: "scheduled",
      actorRole: "system",
      note: String(args.endAt),
    })
    return null
  },
})
