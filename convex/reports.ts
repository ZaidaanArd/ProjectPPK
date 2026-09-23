import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { recordAuditEvent } from "./lib/audit"
import { requireRole } from "./lib/authz"
import { reportStatusValidator } from "./lib/validators"
import { assertReportTransition } from "./lib/workflows"

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

const reportListItemValidator = v.object({
  id: v.id("reports"),
  facilityName: v.string(),
  category: v.string(),
  description: v.string(),
  photoUrl: v.union(v.null(), v.string()),
  status: reportStatusValidator,
  resolutionNote: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireRole(ctx, ["user"])
    return ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    facilityId: v.id("facilities"),
    category: v.string(),
    description: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    photoName: v.optional(v.string()),
  },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, ["user"])
    const facility = await ctx.db.get("facilities", args.facilityId)

    if (!facility || facility.status === "inactive") {
      throw new ConvexError("Fasilitas tidak ditemukan")
    }

    if (!args.category.trim() || !args.description.trim()) {
      throw new ConvexError("Kategori dan deskripsi laporan wajib diisi")
    }

    let photoContentType: string | undefined
    if (args.photoStorageId) {
      const metadata = await ctx.db.system.get(args.photoStorageId)
      if (!metadata) {
        throw new ConvexError("Foto laporan tidak ditemukan")
      }
      if (metadata.size > MAX_PHOTO_BYTES) {
        await ctx.storage.delete(args.photoStorageId)
        throw new ConvexError("Ukuran foto maksimal 5 MB")
      }
      if (!metadata.contentType || !PHOTO_TYPES.has(metadata.contentType)) {
        await ctx.storage.delete(args.photoStorageId)
        throw new ConvexError("Format foto harus JPG, PNG, atau WebP")
      }
      photoContentType = metadata.contentType
    }

    const now = Date.now()
    const id = await ctx.db.insert("reports", {
      reporterId: profile._id,
      facilityId: facility._id,
      category: args.category.trim(),
      description: args.description.trim(),
      photoStorageId: args.photoStorageId,
      photoName: args.photoName?.trim() || undefined,
      photoContentType,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })

    await recordAuditEvent(ctx, {
      entityType: "report",
      entityId: id,
      action: "report.created",
      toStatus: "pending",
      actorId: profile._id,
      actorRole: profile.role,
    })

    return id
  },
})

export const listMine = query({
  args: {},
  returns: v.array(reportListItemValidator),
  handler: async (ctx) => {
    const profile = await requireRole(ctx, ["user"])
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_reporter", (q) => q.eq("reporterId", profile._id))
      .order("desc")
      .collect()

    return Promise.all(
      reports.map(async (report) => {
        const [facility, photoUrl] = await Promise.all([
          ctx.db.get("facilities", report.facilityId),
          report.photoStorageId
            ? ctx.storage.getUrl(report.photoStorageId)
            : Promise.resolve(null),
        ])
        return {
          id: report._id,
          facilityName: facility?.name ?? "Fasilitas dihapus",
          category: report.category,
          description: report.description,
          photoUrl,
          status: report.status,
          resolutionNote: report.resolutionNote,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        }
      })
    )
  },
})

export const listQueue = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("reports"),
      reporterName: v.string(),
      reporterEmail: v.string(),
      facilityId: v.id("facilities"),
      facilityName: v.string(),
      category: v.string(),
      description: v.string(),
      photoUrl: v.union(v.null(), v.string()),
      status: reportStatusValidator,
      resolutionNote: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    await requireRole(ctx, ["officer", "admin"])
    const reports = await ctx.db.query("reports").order("desc").collect()

    return Promise.all(
      reports.map(async (report) => {
        const [facility, reporter, photoUrl] = await Promise.all([
          ctx.db.get("facilities", report.facilityId),
          ctx.db.get("profiles", report.reporterId),
          report.photoStorageId
            ? ctx.storage.getUrl(report.photoStorageId)
            : Promise.resolve(null),
        ])
        return {
          id: report._id,
          reporterName: reporter?.name ?? "Pengguna dihapus",
          reporterEmail: reporter?.email ?? "-",
          facilityId: report.facilityId,
          facilityName: facility?.name ?? "Fasilitas dihapus",
          category: report.category,
          description: report.description,
          photoUrl,
          status: report.status,
          resolutionNote: report.resolutionNote,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        }
      })
    )
  },
})

export const updateStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
    note: v.string(),
    facilityMaintenance: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const report = await ctx.db.get("reports", args.reportId)

    if (!report) {
      throw new ConvexError("Laporan tidak ditemukan")
    }

    const note = args.note.trim()
    if (args.status !== "in_progress" && !note) {
      throw new ConvexError(
        "Catatan wajib diisi untuk menyelesaikan atau menolak laporan"
      )
    }

    assertReportTransition(report.status, args.status)

    const now = Date.now()
    await ctx.db.patch("reports", report._id, {
      status: args.status,
      resolutionNote: note || report.resolutionNote,
      handledBy: actor._id,
      handledAt: now,
      updatedAt: now,
    })

    if (args.facilityMaintenance !== undefined) {
      const facility = await ctx.db.get("facilities", report.facilityId)
      if (facility) {
        const nextStatus = args.facilityMaintenance ? "maintenance" : "active"
        await ctx.db.patch("facilities", facility._id, {
          status: nextStatus,
          updatedAt: now,
        })
        await recordAuditEvent(ctx, {
          entityType: "facility",
          entityId: facility._id,
          action: "facility.status_changed_from_report",
          fromStatus: facility.status,
          toStatus: nextStatus,
          actorId: actor._id,
          actorRole: actor.role,
          note: note || undefined,
        })
      }
    }

    await recordAuditEvent(ctx, {
      entityType: "report",
      entityId: report._id,
      action: `report.${args.status}`,
      fromStatus: report.status,
      toStatus: args.status,
      actorId: actor._id,
      actorRole: actor.role,
      note: note || undefined,
    })

    return null
  },
})
