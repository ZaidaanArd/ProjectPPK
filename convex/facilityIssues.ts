import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import { recordAuditEvent } from "./lib/audit"
import { requireRole } from "./lib/authz"
import { jakartaRange, notify } from "./lib/notifications"
import { overlaps } from "./lib/reservationTime"
import { issueStatusValidator } from "./lib/validators"

const openIssueValidator = v.object({
  id: v.id("facilityIssues"),
  facilityId: v.id("facilities"),
  facilityName: v.string(),
  category: v.string(),
  description: v.string(),
  startAt: v.number(),
  endAt: v.optional(v.number()),
  revision: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const managedIssueValidator = v.object({
  id: v.id("facilityIssues"),
  facilityId: v.id("facilities"),
  facilityName: v.string(),
  category: v.string(),
  description: v.string(),
  startAt: v.number(),
  endAt: v.optional(v.number()),
  status: issueStatusValidator,
  revision: v.number(),
  createdByName: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

function validateIssueInput(input: {
  category: string
  description: string
  startAt: number
  endAt?: number
}) {
  if (!input.category.trim()) throw new ConvexError("Kategori gangguan wajib diisi")
  if (!input.description.trim()) throw new ConvexError("Deskripsi gangguan wajib diisi")
  if (!Number.isFinite(input.startAt)) throw new ConvexError("Waktu mulai tidak valid")
  if (input.endAt !== undefined) {
    if (!Number.isFinite(input.endAt)) throw new ConvexError("Waktu selesai tidak valid")
    if (input.endAt <= input.startAt)
      throw new ConvexError("Waktu selesai harus setelah waktu mulai")
  }
}

function issueRange(issue: { startAt: number; endAt?: number }) {
  return { startAt: issue.startAt, endAt: issue.endAt ?? Number.MAX_SAFE_INTEGER }
}

/** Reservations directly overlapping an issue range. Future only. */
async function affectedReservations(
  ctx: MutationCtx,
  facilityId: Id<"facilities">,
  startAt: number,
  endAt?: number
) {
  const end = endAt ?? Number.MAX_SAFE_INTEGER
  const now = Date.now()
  const out: { userId: Id<"profiles">; startAt: number; endAt: number }[] = []
  for (const status of ["approved", "pending"] as const) {
    const rows = await ctx.db
      .query("reservations")
      .withIndex("by_facility_status_start", (q) =>
        q.eq("facilityId", facilityId).eq("status", status).lt("startAt", end)
      )
      .collect()
    for (const row of rows) {
      if (row.endAt <= now) continue
      if (row.endAt <= startAt) continue
      if (overlaps(row.startAt, row.endAt, startAt, end)) {
        out.push({ userId: row.userId, startAt: row.startAt, endAt: row.endAt })
      }
    }
  }
  return out
}

async function notifyAffected(
  ctx: MutationCtx,
  issue: { _id: Id<"facilityIssues">; facilityId: Id<"facilities">; startAt: number; endAt?: number; revision: number; category: string },
  type: "disruption.created" | "disruption.updated" | "disruption.resolved",
  title: string,
  body: string
) {
  const affected = await affectedReservations(ctx, issue.facilityId, issue.startAt, issue.endAt)
  const seen = new Set<string>()
  for (const row of affected) {
    const key = row.userId as string
    if (seen.has(key)) continue
    seen.add(key)
    const event = type.split(".")[1]
    await notify(ctx, {
      userId: row.userId,
      type,
      title,
      body,
      facilityId: issue.facilityId,
      issueId: issue._id,
      dedupKey: `disruption:${issue._id}:rev${issue.revision}:user:${key}:${event}`,
    })
  }
}

/** Public banner data. No actor identity, no report internals. */
export const listOpen = query({
  args: { facilityId: v.id("facilities") },
  returns: v.array(openIssueValidator),
  handler: async (ctx, args) => {
    const issues = await ctx.db
      .query("facilityIssues")
      .withIndex("by_facility_status", (q) =>
        q.eq("facilityId", args.facilityId).eq("status", "open")
      )
      .collect()
    return Promise.all(
      issues.map(async (issue) => ({
        id: issue._id,
        facilityId: issue.facilityId,
        facilityName:
          (await ctx.db.get("facilities", issue.facilityId))?.name ?? "Fasilitas",
        category: issue.category,
        description: issue.description,
        startAt: issue.startAt,
        endAt: issue.endAt,
        revision: issue.revision,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      }))
    )
  },
})

export const listManaged = query({
  args: {},
  returns: v.array(managedIssueValidator),
  handler: async (ctx) => {
    await requireRole(ctx, ["officer", "admin"])
    const issues = await ctx.db.query("facilityIssues").order("desc").collect()
    return Promise.all(
      issues.slice(0, 100).map(async (issue) => ({
        id: issue._id,
        facilityId: issue.facilityId,
        facilityName:
          (await ctx.db.get("facilities", issue.facilityId))?.name ?? "Fasilitas dihapus",
        category: issue.category,
        description: issue.description,
        startAt: issue.startAt,
        endAt: issue.endAt,
        status: issue.status,
        revision: issue.revision,
        createdByName:
          (await ctx.db.get("profiles", issue.createdBy))?.name ?? "Petugas",
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      }))
    )
  },
})

/** Read-only impact preview before publishing a disruption. */
export const previewImpact = query({
  args: {
    facilityId: v.id("facilities"),
    startAt: v.number(),
    endAt: v.optional(v.number()),
  },
  returns: v.object({ approved: v.number(), pending: v.number() }),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["officer", "admin"])
    const end = args.endAt ?? Number.MAX_SAFE_INTEGER
    let approved = 0
    let pending = 0
    for (const status of ["approved", "pending"] as const) {
      const rows = await ctx.db
        .query("reservations")
        .withIndex("by_facility_status_start", (q) =>
          q.eq("facilityId", args.facilityId).eq("status", status).lt("startAt", end)
        )
        .collect()
      const count = rows.filter(
        (r) => r.endAt > Date.now() && r.endAt > args.startAt && overlaps(r.startAt, r.endAt, args.startAt, end)
      ).length
      if (status === "approved") approved = count
      else pending = count
    }
    return { approved, pending }
  },
})

export const create = mutation({
  args: {
    facilityId: v.id("facilities"),
    category: v.string(),
    description: v.string(),
    startAt: v.number(),
    endAt: v.optional(v.number()),
    reportId: v.optional(v.id("reports")),
  },
  returns: v.id("facilityIssues"),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const facility = await ctx.db.get("facilities", args.facilityId)
    if (!facility || facility.status === "inactive")
      throw new ConvexError("Fasilitas tidak ditemukan atau nonaktif")
    validateIssueInput(args)
    if (args.reportId) {
      const report = await ctx.db.get("reports", args.reportId)
      if (!report || report.facilityId !== facility._id)
        throw new ConvexError("Laporan tidak cocok dengan fasilitas ini")
    }
    const now = Date.now()
    const id = await ctx.db.insert("facilityIssues", {
      facilityId: facility._id,
      reportId: args.reportId,
      category: args.category.trim(),
      description: args.description.trim(),
      startAt: args.startAt,
      endAt: args.endAt,
      status: "open",
      revision: 1,
      createdBy: actor._id,
      createdAt: now,
      updatedAt: now,
    })
    await recordAuditEvent(ctx, {
      entityType: "disruption",
      entityId: id,
      action: "disruption.created",
      toStatus: "open",
      actorId: actor._id,
      actorRole: actor.role,
      note: `${args.category.trim()}: ${args.description.trim().slice(0, 140)}`,
    })
    const range = issueRange({ startAt: args.startAt, endAt: args.endAt })
    const rangeText =
      args.endAt === undefined
        ? "sampai pemberitahuan lebih lanjut"
        : jakartaRange(range.startAt, range.endAt)
    await notifyAffected(
      ctx,
      { _id: id, facilityId: facility._id, startAt: args.startAt, endAt: args.endAt, revision: 1, category: args.category.trim() },
      "disruption.created",
      `Gangguan di ${facility.name}`,
      `${args.category.trim()} pada ${rangeText}. Fasilitas masih dapat digunakan.`
    )
    return id
  },
})

export const update = mutation({
  args: {
    issueId: v.id("facilityIssues"),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    endAt: v.optional(v.number()),
    clearEndAt: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const issue = await ctx.db.get("facilityIssues", args.issueId)
    if (!issue || issue.status !== "open") throw new ConvexError("Gangguan tidak aktif")
    const category = (args.category ?? issue.category).trim()
    const description = (args.description ?? issue.description).trim()
    const endAt = args.clearEndAt ? undefined : (args.endAt ?? issue.endAt)
    validateIssueInput({ category, description, startAt: issue.startAt, endAt })
    const revision = issue.revision + 1
    await ctx.db.patch("facilityIssues", issue._id, {
      category,
      description,
      endAt,
      revision,
      updatedAt: Date.now(),
    })
    await recordAuditEvent(ctx, {
      entityType: "disruption",
      entityId: issue._id,
      action: "disruption.updated",
      actorId: actor._id,
      actorRole: actor.role,
      note: `rev${revision}`,
    })
    const facility = await ctx.db.get("facilities", issue.facilityId)
    const rangeText =
      endAt === undefined ? "sampai pemberitahuan lebih lanjut" : jakartaRange(issue.startAt, endAt)
    await notifyAffected(
      ctx,
      { _id: issue._id, facilityId: issue.facilityId, startAt: issue.startAt, endAt, revision, category },
      "disruption.updated",
      `Gangguan diperbarui di ${facility?.name ?? "fasilitas"}`,
      `${category} pada ${rangeText}. Fasilitas masih dapat digunakan.`
    )
    return null
  },
})

export const resolve = mutation({
  args: { issueId: v.id("facilityIssues") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const issue = await ctx.db.get("facilityIssues", args.issueId)
    if (!issue || issue.status !== "open") throw new ConvexError("Gangguan tidak aktif")
    const now = Date.now()
    await ctx.db.patch("facilityIssues", issue._id, {
      status: "closed",
      closedBy: actor._id,
      closedAt: now,
      updatedAt: now,
    })
    await recordAuditEvent(ctx, {
      entityType: "disruption",
      entityId: issue._id,
      action: "disruption.resolved",
      fromStatus: "open",
      toStatus: "closed",
      actorId: actor._id,
      actorRole: actor.role,
    })
    const facility = await ctx.db.get("facilities", issue.facilityId)
    await notifyAffected(
      ctx,
      { _id: issue._id, facilityId: issue.facilityId, startAt: issue.startAt, endAt: issue.endAt, revision: issue.revision, category: issue.category },
      "disruption.resolved",
      `Gangguan selesai di ${facility?.name ?? "fasilitas"}`,
      `${issue.category} telah selesai ditangani. Terima kasih.`
    )
    return null
  },
})
