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

describe("report handling", () => {
  it("starts without a note, requires a completion note, and reactivates the facility", async () => {
    const t = convexTest(schema, modules)
    const { reportId, facilityId } = await t.run(async (ctx) => {
      const now = Date.now()
      const profile = async (authUserId: string, role: "user" | "officer") =>
        ctx.db.insert("profiles", {
          authUserId,
          name: role,
          email: `${role}@example.test`,
          role,
          status: "active",
          mustChangePassword: false,
          createdAt: now,
          updatedAt: now,
        })
      const userId = await profile("report-user", "user")
      const officerId = await profile("report-officer", "officer")
      const facilityId = await ctx.db.insert("facilities", {
        name: "Aula",
        type: "Ruang",
        location: "Kampus",
        capacity: 30,
        description: "Aula",
        status: "active",
        createdBy: officerId,
        createdAt: now,
        updatedAt: now,
      })
      const reportId = await ctx.db.insert("reports", {
        reporterId: userId,
        facilityId,
        category: "AC",
        description: "Rusak",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      return { reportId, facilityId }
    })
    const officer = t.withIdentity({ subject: "report-officer" })
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "in_progress",
      note: "",
      facilityMaintenance: true,
    })
    expect(
      await t.run((ctx) => ctx.db.get("facilities", facilityId))
    ).toMatchObject({
      status: "maintenance",
    })
    await expect(
      officer.mutation(api.reports.updateStatus, {
        reportId,
        status: "resolved",
        note: "",
        facilityMaintenance: false,
      })
    ).rejects.toThrow("Catatan wajib diisi")
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "resolved",
      note: "AC diperbaiki",
      facilityMaintenance: false,
    })
    expect(await t.run((ctx) => ctx.db.get("reports", reportId))).toMatchObject(
      {
        status: "resolved",
        resolutionNote: "AC diperbaiki",
      }
    )
    expect(
      await t.run((ctx) => ctx.db.get("facilities", facilityId))
    ).toMatchObject({
      status: "active",
    })
  })
})
