import { convexTest } from "convex-test"
import { describe, expect, it, vi } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

vi.mock("./auth", () => ({
  authComponent: {
    safeGetAuthUser: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
    }) => {
      const identity = await ctx.auth.getUserIdentity()
      return identity ? { _id: identity.subject } : null
    },
  },
}))

const modules = (
  import.meta as ImportMeta & {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>
  }
).glob("./**/*.ts")

type TestContext = ReturnType<typeof convexTest>

async function seedFacility(
  t: TestContext,
  related?: {
    reservationStatus?: "pending" | "approved" | "cancelled"
    reportStatus?: "pending" | "in_progress" | "resolved"
  }
) {
  return t.run(async (ctx) => {
    const now = Date.now()
    const adminId = await ctx.db.insert("profiles", {
      authUserId: "facility-admin",
      name: "Admin",
      email: "facility-admin@example.test",
      role: "admin",
      status: "active",
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
    })
    const userId = await ctx.db.insert("profiles", {
      authUserId: "facility-user",
      name: "Pengguna",
      email: "facility-user@example.test",
      role: "user",
      status: "active",
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
    })
    const facilityId = await ctx.db.insert("facilities", {
      name: "Ruang Uji",
      type: "Ruang",
      location: "Gedung Uji",
      capacity: 10,
      description: "Ruang untuk pengujian",
      status: "active",
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    })
    if (related?.reservationStatus) {
      await ctx.db.insert("reservations", {
        userId,
        facilityId,
        purpose: "Praktikum",
        startAt: now + 60 * 60 * 1000,
        endAt: now + 2 * 60 * 60 * 1000,
        status: related.reservationStatus,
        createdAt: now,
        updatedAt: now,
      })
    }
    if (related?.reportStatus) {
      await ctx.db.insert("reports", {
        reporterId: userId,
        facilityId,
        category: "Perangkat",
        description: "Rusak",
        status: related.reportStatus,
        createdAt: now,
        updatedAt: now,
      })
    }
    return { facilityId }
  })
}

describe("facility removal", () => {
  it("removes a facility without active activity and records an audit event", async () => {
    const t = convexTest(schema, modules)
    const { facilityId } = await seedFacility(t)
    const admin = t.withIdentity({ subject: "facility-admin" })

    await admin.mutation(api.facilities.remove, { facilityId })

    expect(
      await t.run((ctx) => ctx.db.get("facilities", facilityId))
    ).toBeNull()
    expect(await admin.query(api.facilities.listManaged, {})).toHaveLength(0)
    const audits = await t.run((ctx) =>
      ctx.db
        .query("auditEvents")
        .withIndex("by_entity", (q) =>
          q.eq("entityType", "facility").eq("entityId", facilityId)
        )
        .collect()
    )
    expect(audits.map((event) => event.action)).toContain("facility.deleted")
  })

  it("blocks removal while an active reservation exists", async () => {
    const t = convexTest(schema, modules)
    const { facilityId } = await seedFacility(t, {
      reservationStatus: "pending",
    })
    const admin = t.withIdentity({ subject: "facility-admin" })

    await expect(
      admin.mutation(api.facilities.remove, { facilityId })
    ).rejects.toThrow("reservasi aktif")
    expect(
      await t.run((ctx) => ctx.db.get("facilities", facilityId))
    ).not.toBeNull()
  })

  it("blocks removal while a report is still unfinished", async () => {
    const t = convexTest(schema, modules)
    const { facilityId } = await seedFacility(t, {
      reportStatus: "in_progress",
    })
    const admin = t.withIdentity({ subject: "facility-admin" })

    await expect(
      admin.mutation(api.facilities.remove, { facilityId })
    ).rejects.toThrow("laporan yang belum selesai")
  })

  it("allows removal after related records reach a terminal status", async () => {
    const t = convexTest(schema, modules)
    const { facilityId } = await seedFacility(t, {
      reservationStatus: "cancelled",
      reportStatus: "resolved",
    })
    const admin = t.withIdentity({ subject: "facility-admin" })

    await admin.mutation(api.facilities.remove, { facilityId })

    expect(
      await t.run((ctx) => ctx.db.get("facilities", facilityId))
    ).toBeNull()
  })
})
