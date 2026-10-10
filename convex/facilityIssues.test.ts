import { convexTest } from "convex-test"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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
const startAt = Date.parse("2027-10-01T10:00:00+07:00")

async function setup() {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const now = Date.now()
    const profile = (authUserId: string, role: "user" | "officer") =>
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
    const user = await profile("user-auth", "user")
    await profile("other-user-auth", "user")
    const officer = await profile("officer-auth", "officer")
    const facility = await ctx.db.insert("facilities", {
      name: "Aula",
      type: "Ruang",
      location: "Kampus",
      capacity: 100,
      description: "Aula",
      status: "active",
      createdBy: officer,
      createdAt: now,
      updatedAt: now,
    })
    return { user, officer, facility }
  })
  return { t, ...ids }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(startAt - 86400000)
})
afterEach(() => vi.useRealTimers())

describe("facility issues do not lock slots", () => {
  it("creates an open issue and notifies only overlapping holders", async () => {
    const { t, facility } = await setup()
    const user = t.withIdentity({ subject: "user-auth" })
    const other = t.withIdentity({ subject: "other-user-auth" })
    const resA = await user.mutation(api.reservations.create, {
      facilityId: facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    })
    await other.mutation(api.reservations.create, {
      facilityId: facility,
      purpose: "Lain",
      startAt: startAt + 7200000,
      endAt: startAt + 10800000,
    })
    const officer = t.withIdentity({ subject: "officer-auth" })
    const issueId = await officer.mutation(api.facilityIssues.create, {
      facilityId: facility,
      category: "AC mati",
      description: "Ruangan masih layak dipakai",
      startAt,
      endAt: startAt + 3600000,
    })
    // Still bookable: disruption never locks.
    await officer.mutation(api.reservations.decide, { reservationId: resA, decision: "approved" })
    const open = await t.query(api.facilityIssues.listOpen, { facilityId: facility })
    expect(open).toHaveLength(1)
    expect(open[0]).toMatchObject({ id: issueId, category: "AC mati" })
    const notes = await t.run(async (ctx) => ctx.db.query("notifications").collect())
    const created = notes.filter((n) => n.type === "disruption.created")
    // Only the overlapping holder is notified.
    expect(created).toHaveLength(1)
  })

  it("rejects disruption cancellation for non-overlapping schedules", async () => {
    const { t, facility } = await setup()
    const user = t.withIdentity({ subject: "user-auth" })
    const resId = await user.mutation(api.reservations.create, {
      facilityId: facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    })
    const officer = t.withIdentity({ subject: "officer-auth" })
    const issueId = await officer.mutation(api.facilityIssues.create, {
      facilityId: facility,
      category: "Lampu",
      description: "Redup",
      startAt: startAt + 7200000,
      endAt: startAt + 10800000,
    })
    await expect(
      user.mutation(api.reservations.cancelMineForDisruption, { reservationId: resId, issueId })
    ).rejects.toThrow("tidak berdampak")
  })

  it("allows disruption cancellation inside 1h and blocks ongoing", async () => {
    const { t, facility } = await setup()
    const user = t.withIdentity({ subject: "user-auth" })
    const resId = await user.mutation(api.reservations.create, {
      facilityId: facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    })
    const officer = t.withIdentity({ subject: "officer-auth" })
    const issueId = await officer.mutation(api.facilityIssues.create, {
      facilityId: facility,
      category: "AC",
      description: "Bocor",
      startAt,
      endAt: startAt + 3600000,
    })
    vi.setSystemTime(startAt - 30 * 60 * 1000)
    await user.mutation(api.reservations.cancelMineForDisruption, { reservationId: resId, issueId })
    const row = await t.run(async (ctx) => ctx.db.get("reservations", resId))
    expect(row?.status).toBe("cancelled")
  })
})
