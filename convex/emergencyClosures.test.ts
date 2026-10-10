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
    await profile("user-auth", "user")
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
    return { officer, facility }
  })
  return { t, ...ids }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(startAt - 86400000)
})
afterEach(() => vi.useRealTimers())

describe("emergency closures", () => {
  it("safety mode cancels future but keeps history and blocks new bookings", async () => {
    const { t, facility } = await setup()
    const user = t.withIdentity({ subject: "user-auth" })
    const officer = t.withIdentity({ subject: "officer-auth" })
    const future = await user.mutation(api.reservations.create, {
      facilityId: facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    })
    await officer.mutation(api.reservations.decide, { reservationId: future, decision: "approved" })
    const closureId = await officer.mutation(api.emergencyClosures.close, {
      facilityId: facility,
      reason: "Kabel berbahaya",
      mode: "safety",
    })
    const row = await t.run(async (ctx) => ctx.db.get("reservations", future))
    expect(row?.status).toBe("cancelled")
    expect(row?.decisionNote).toMatch("Dibatalkan pengelola")
    // New bookings blocked.
    await expect(
      user.mutation(api.reservations.create, {
        facilityId: facility,
        purpose: "Baru",
        startAt: startAt + 7200000,
        endAt: startAt + 10800000,
      })
    ).rejects.toThrow("tidak dapat dipesan")
    // Reopen does not resurrect.
    await officer.mutation(api.emergencyClosures.reopen, { closureId, confirmSafe: true })
    expect((await t.run(async (ctx) => ctx.db.get("reservations", future)))?.status).toBe("cancelled")
  })

  it("long-repair mode notifies without cancelling and allows user choice", async () => {
    const { t, facility } = await setup()
    const user = t.withIdentity({ subject: "user-auth" })
    const officer = t.withIdentity({ subject: "officer-auth" })
    const future = await user.mutation(api.reservations.create, {
      facilityId: facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    })
    await officer.mutation(api.reservations.decide, { reservationId: future, decision: "approved" })
    const closureId = await officer.mutation(api.emergencyClosures.close, {
      facilityId: facility,
      reason: "Renovasi besar",
      mode: "long_repair",
    })
    expect((await t.run(async (ctx) => ctx.db.get("reservations", future)))?.status).toBe("approved")
    await user.mutation(api.emergencyClosures.cancelMineForClosure, {
      reservationId: future,
      closureId,
    })
    expect((await t.run(async (ctx) => ctx.db.get("reservations", future)))?.status).toBe("cancelled")
  })

  it("previews impact read-only without changing data", async () => {
    const { t, facility } = await setup()
    const user = t.withIdentity({ subject: "user-auth" })
    const officer = t.withIdentity({ subject: "officer-auth" })
    await user.mutation(api.reservations.create, {
      facilityId: facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    })
    const preview = await officer.query(api.emergencyClosures.previewImpact, { facilityId: facility })
    expect(preview.pending).toHaveLength(1)
    expect(await t.run(async (ctx) => ctx.db.query("emergencyClosures").collect())).toHaveLength(0)
  })
})
