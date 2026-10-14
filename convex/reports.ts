import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { closeWindow } from "./maintenance"
import { closeFacility, notifyReopening } from "./emergencyClosures"
import { createIssue, resolveReportIssues } from "./facilityIssues"
import { recordAuditEvent } from "./lib/audit"
import { validateUploadedPhoto } from "./lib/photos"
import { requireRole } from "./lib/authz"
import {
  maintenanceStatusValidator,
  reportStatusValidator,
  handlingImpactValidator,
} from "./lib/validators"
import { assertReportTransition } from "./lib/workflows"

const reportListItemValidator = v.object({
  id: v.id("reports"),
  facilityName: v.string(),
  category: v.string(),
  description: v.string(),
  photoUrl: v.union(v.null(), v.string()),
  status: reportStatusValidator,
  handlingImpact: v.optional(handlingImpactValidator),
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
      photoContentType = await validateUploadedPhoto(
        ctx,
        args.photoStorageId,
        "Foto laporan"
      )
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
          handlingImpact: report.handlingImpact,
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
      handlingImpact: v.optional(handlingImpactValidator),
      resolutionNote: v.optional(v.string()),
      // Repairs scheduled from this report, newest first.
      maintenance: v.array(
        v.object({
          id: v.id("maintenanceWindows"),
          startAt: v.number(),
          endAt: v.number(),
          status: maintenanceStatusValidator,
        })
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    await requireRole(ctx, ["officer", "admin"])
    const reports = await ctx.db.query("reports").order("desc").collect()

    return Promise.all(
      reports.map(async (report) => {
        const [facility, reporter, photoUrl, windows] = await Promise.all([
          ctx.db.get("facilities", report.facilityId),
          ctx.db.get("profiles", report.reporterId),
          report.photoStorageId
            ? ctx.storage.getUrl(report.photoStorageId)
            : Promise.resolve(null),
          ctx.db
            .query("maintenanceWindows")
            .withIndex("by_report", (q) => q.eq("reportId", report._id))
            .order("desc")
            .collect(),
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
          handlingImpact: report.handlingImpact,
          resolutionNote: report.resolutionNote,
          maintenance: windows.map((window) => ({
            id: window._id,
            startAt: window.startAt,
            endAt: window.endAt,
            status: window.status,
          })),
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
    handlingImpact: v.optional(handlingImpactValidator),
    publicNotice: v.optional(v.string()),
    confirmSafe: v.optional(v.boolean()),
    // Legacy: older clients toggled a whole-facility maintenance status here.
    // Only `false` is still honoured, to reopen a facility left in that state.
    facilityMaintenance: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["officer", "admin"])
    const report = await ctx.db.get("reports", args.reportId)

    if (!report) {
      throw new ConvexError("Laporan tidak ditemukan")
    }

    if (
      report.status === args.status &&
      (args.status !== "in_progress" ||
        report.handlingImpact === args.handlingImpact)
    )
      return null

    const note = args.note.trim()
    if (args.status !== "in_progress" && !note) {
      throw new ConvexError(
        "Catatan wajib diisi untuk menyelesaikan atau menolak laporan"
      )
    }

    assertReportTransition(report.status, args.status)

    const now = Date.now()
    if (args.status === "in_progress") {
      if (!args.handlingImpact)
        throw new ConvexError("Pilih dampak penanganan terlebih dahulu")
      const publicNotice = args.publicNotice?.trim()
      if (!publicNotice)
        throw new ConvexError(
          "Keterangan publik wajib diisi tanpa data pribadi"
        )
      if (publicNotice.length > 500)
        throw new ConvexError("Keterangan publik maksimal 500 karakter")
      if (args.handlingImpact === "usable") {
        await createIssue(
          ctx,
          {
            facilityId: report.facilityId,
            reportId: report._id,
            category: report.category,
            description: publicNotice,
            startAt: now,
          },
          actor
        )
      } else {
        await closeFacility(
          ctx,
          {
            facilityId: report.facilityId,
            reportId: report._id,
            reason: publicNotice,
            mode: "safety",
          },
          actor,
          "handling"
        )
      }
    } else if (report.handlingImpact === "closed" && !args.confirmSafe) {
      throw new ConvexError(
        "Pastikan penanganan selesai dan fasilitas aman sebelum menutup laporan"
      )
    }
    await ctx.db.patch("reports", report._id, {
      status: args.status,
      handlingImpact:
        args.status === "in_progress"
          ? args.handlingImpact
          : report.handlingImpact,
      resolutionNote: note || report.resolutionNote,
      handledBy: actor._id,
      handledAt: now,
      updatedAt: now,
    })

    // Closing a report ends its repairs: started ones complete now, future
    // ones are cancelled, so their slots open again.
    if (args.status === "resolved" || args.status === "rejected") {
      await resolveReportIssues(ctx, report._id, actor)
      const remaining = await ctx.db
        .query("reports")
        .withIndex("by_facility_and_status", (q) =>
          q.eq("facilityId", report.facilityId).eq("status", "in_progress")
        )
        .collect()
      if (
        report.handlingImpact === "closed" &&
        args.confirmSafe &&
        !remaining.some((r) => r.handlingImpact === "closed")
      ) {
        const closures = await ctx.db
          .query("emergencyClosures")
          .withIndex("by_facility_status", (q) =>
            q.eq("facilityId", report.facilityId).eq("status", "closed")
          )
          .collect()
        for (const closure of closures) {
          if (closure.source !== "handling") continue
          await ctx.db.patch("emergencyClosures", closure._id, {
            status: "reopened",
            reopenedBy: actor._id,
            reopenedAt: now,
            updatedAt: now,
          })
          await notifyReopening(ctx, closure._id, closure.facilityId)
          await recordAuditEvent(ctx, {
            entityType: "closure",
            entityId: closure._id,
            action: "closure.reopened",
            actorId: actor._id,
            actorRole: actor.role,
            fromStatus: "closed",
            toStatus: "reopened",
            note: "Penanganan selesai dan fasilitas dinyatakan aman",
          })
        }
      }
      const windows = await ctx.db
        .query("maintenanceWindows")
        .withIndex("by_report", (q) => q.eq("reportId", report._id))
        .collect()
      for (const window of windows) {
        if (window.status === "scheduled") {
          await closeWindow(ctx, window, actor, `Laporan ${args.status}`)
        }
      }
    }

    if (args.facilityMaintenance === false) {
      const facility = await ctx.db.get("facilities", report.facilityId)
      if (facility?.status === "maintenance") {
        await ctx.db.patch("facilities", facility._id, {
          status: "active",
          updatedAt: now,
        })
        await recordAuditEvent(ctx, {
          entityType: "facility",
          entityId: facility._id,
          action: "facility.status_changed_from_report",
          fromStatus: facility.status,
          toStatus: "active",
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
