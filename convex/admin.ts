import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { recordAuditEvent } from "./lib/audit"
import { requireRole } from "./lib/authz"
import {
  accountStatusValidator,
  reportStatusValidator,
  reservationStatusValidator,
  roleValidator,
} from "./lib/validators"

const accountValidator = v.object({
  id: v.id("profiles"),
  name: v.string(),
  email: v.string(),
  role: roleValidator,
  status: accountStatusValidator,
  userKind: v.optional(v.union(v.literal("student"), v.literal("lecturer"))),
  institutionalId: v.optional(v.string()),
  mustChangePassword: v.boolean(),
  rejectionReason: v.optional(v.string()),
  createdAt: v.number(),
})

export const listAccounts = query({
  args: { status: v.optional(accountStatusValidator) },
  returns: v.array(accountValidator),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"])
    const profiles = args.status
      ? await ctx.db
          .query("profiles")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("profiles").order("desc").collect()

    return profiles.map((profile) => ({
      id: profile._id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      userKind: profile.userKind,
      institutionalId: profile.institutionalId,
      mustChangePassword: profile.mustChangePassword,
      rejectionReason: profile.rejectionReason,
      createdAt: profile.createdAt,
    }))
  },
})

export const reviewAccount = mutation({
  args: {
    profileId: v.id("profiles"),
    decision: v.union(v.literal("active"), v.literal("rejected")),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin"])
    const profile = await ctx.db.get(args.profileId)

    if (!profile || profile.status !== "pending") {
      throw new ConvexError("Akun tidak tersedia untuk diverifikasi")
    }

    if (args.decision === "rejected" && !args.reason?.trim()) {
      throw new ConvexError("Alasan penolakan wajib diisi")
    }

    await ctx.db.patch(profile._id, {
      status: args.decision,
      rejectionReason:
        args.decision === "rejected" ? args.reason?.trim() : undefined,
      updatedAt: Date.now(),
    })

    await recordAuditEvent(ctx, {
      entityType: "account",
      entityId: profile._id,
      action: `account.${args.decision}`,
      fromStatus: profile.status,
      toStatus: args.decision,
      actorId: actor._id,
      actorRole: actor.role,
      note: args.reason?.trim() || undefined,
    })

    return null
  },
})

export const setAccountStatus = mutation({
  args: {
    profileId: v.id("profiles"),
    status: v.union(v.literal("active"), v.literal("disabled")),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin"])
    const profile = await ctx.db.get(args.profileId)

    if (!profile) {
      throw new ConvexError("Akun tidak ditemukan")
    }

    if (profile._id === actor._id && args.status === "disabled") {
      throw new ConvexError("Admin tidak dapat menonaktifkan akunnya sendiri")
    }

    if (args.status === "disabled" && !args.reason?.trim()) {
      throw new ConvexError("Alasan penonaktifan wajib diisi")
    }

    await ctx.db.patch(profile._id, {
      status: args.status,
      rejectionReason:
        args.status === "disabled" ? args.reason?.trim() : undefined,
      updatedAt: Date.now(),
    })

    await recordAuditEvent(ctx, {
      entityType: "account",
      entityId: profile._id,
      action: `account.${args.status}`,
      fromStatus: profile.status,
      toStatus: args.status,
      actorId: actor._id,
      actorRole: actor.role,
      note: args.reason?.trim() || undefined,
    })

    return null
  },
})

export const createAccount = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    temporaryPassword: v.string(),
    role: roleValidator,
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, ["admin"])
    const email = args.email.trim().toLowerCase()

    if (!args.name.trim() || !email) {
      throw new ConvexError("Nama dan email wajib diisi")
    }
    if (args.temporaryPassword.length < 8) {
      throw new ConvexError("Password sementara minimal 8 karakter")
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    if (existing) {
      throw new ConvexError("Email sudah terdaftar")
    }

    const { auth } = await authComponent.getAuth(createAuth, ctx)
    const result = await auth.api.signUpEmail({
      body: {
        name: args.name.trim(),
        email,
        password: args.temporaryPassword,
      },
    })
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", result.user.id))
      .unique()

    if (!profile) {
      throw new ConvexError("Profil akun gagal dibuat")
    }

    await ctx.db.patch(profile._id, {
      role: args.role,
      status: "active",
      mustChangePassword: true,
      updatedAt: Date.now(),
    })

    await recordAuditEvent(ctx, {
      entityType: "account",
      entityId: profile._id,
      action: "account.created_by_admin",
      toStatus: "active",
      actorId: actor._id,
      actorRole: actor.role,
      note: `Role: ${args.role}`,
    })

    return profile._id
  },
})

export const bootstrapFirstAdmin = mutation({
  args: { email: v.string(), secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const expectedSecret = process.env.BOOTSTRAP_SECRET
    if (!expectedSecret || args.secret !== expectedSecret) {
      throw new ConvexError("Bootstrap secret tidak valid")
    }

    const existingAdmin = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first()
    if (existingAdmin) {
      throw new ConvexError("Admin pertama sudah tersedia")
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) =>
        q.eq("email", args.email.trim().toLowerCase())
      )
      .unique()
    if (!profile) {
      throw new ConvexError("Daftarkan akun terlebih dahulu")
    }

    await ctx.db.patch(profile._id, {
      role: "admin",
      status: "active",
      updatedAt: Date.now(),
    })
    await recordAuditEvent(ctx, {
      entityType: "account",
      entityId: profile._id,
      action: "account.bootstrapped_as_admin",
      fromStatus: profile.status,
      toStatus: "active",
      actorRole: "system",
    })

    return null
  },
})

export const analytics = query({
  args: {},
  returns: v.object({
    accounts: v.number(),
    facilities: v.number(),
    reservations: v.number(),
    reports: v.number(),
    reservationsByStatus: v.array(
      v.object({ status: reservationStatusValidator, count: v.number() })
    ),
    reportsByStatus: v.array(
      v.object({ status: reportStatusValidator, count: v.number() })
    ),
    facilityUsage: v.array(
      v.object({
        facilityId: v.id("facilities"),
        name: v.string(),
        approvedReservations: v.number(),
        reports: v.number(),
      })
    ),
  }),
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"])
    const [accounts, facilities, reservations, reports] = await Promise.all([
      ctx.db.query("profiles").collect(),
      ctx.db.query("facilities").collect(),
      ctx.db.query("reservations").collect(),
      ctx.db.query("reports").collect(),
    ])

    const reservationStatuses = [
      "pending",
      "approved",
      "rejected",
      "cancelled",
    ] as const
    const reportStatuses = [
      "pending",
      "in_progress",
      "resolved",
      "rejected",
    ] as const

    return {
      accounts: accounts.length,
      facilities: facilities.length,
      reservations: reservations.length,
      reports: reports.length,
      reservationsByStatus: reservationStatuses.map((status) => ({
        status,
        count: reservations.filter((item) => item.status === status).length,
      })),
      reportsByStatus: reportStatuses.map((status) => ({
        status,
        count: reports.filter((item) => item.status === status).length,
      })),
      facilityUsage: facilities
        .map((facility) => ({
          facilityId: facility._id,
          name: facility.name,
          approvedReservations: reservations.filter(
            (item) =>
              item.facilityId === facility._id && item.status === "approved"
          ).length,
          reports: reports.filter((item) => item.facilityId === facility._id)
            .length,
        }))
        .sort((a, b) => b.approvedReservations - a.approvedReservations),
    }
  },
})

export const exportData = query({
  args: {
    kind: v.union(v.literal("reservations"), v.literal("reports")),
  },
  returns: v.union(
    v.object({
      kind: v.literal("reservations"),
      rows: v.array(
        v.object({
          id: v.string(),
          facility: v.string(),
          applicant: v.string(),
          email: v.string(),
          purpose: v.string(),
          startAt: v.number(),
          endAt: v.number(),
          status: reservationStatusValidator,
        })
      ),
    }),
    v.object({
      kind: v.literal("reports"),
      rows: v.array(
        v.object({
          id: v.string(),
          facility: v.string(),
          reporter: v.string(),
          email: v.string(),
          category: v.string(),
          description: v.string(),
          status: reportStatusValidator,
          resolutionNote: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    await requireRole(ctx, ["admin"])

    if (args.kind === "reservations") {
      const reservations = await ctx.db.query("reservations").collect()
      return {
        kind: "reservations" as const,
        rows: await Promise.all(
          reservations.map(async (item) => {
            const [facility, applicant] = await Promise.all([
              ctx.db.get(item.facilityId),
              ctx.db.get(item.userId),
            ])
            return {
              id: item._id,
              facility: facility?.name ?? "Fasilitas dihapus",
              applicant: applicant?.name ?? "Pengguna dihapus",
              email: applicant?.email ?? "-",
              purpose: item.purpose,
              startAt: item.startAt,
              endAt: item.endAt,
              status: item.status,
            }
          })
        ),
      }
    }

    const reports = await ctx.db.query("reports").collect()
    return {
      kind: "reports" as const,
      rows: await Promise.all(
        reports.map(async (item) => {
          const [facility, reporter] = await Promise.all([
            ctx.db.get(item.facilityId),
            ctx.db.get(item.reporterId),
          ])
          return {
            id: item._id,
            facility: facility?.name ?? "Fasilitas dihapus",
            reporter: reporter?.name ?? "Pengguna dihapus",
            email: reporter?.email ?? "-",
            category: item.category,
            description: item.description,
            status: item.status,
            resolutionNote: item.resolutionNote ?? "",
          }
        })
      ),
    }
  },
})
