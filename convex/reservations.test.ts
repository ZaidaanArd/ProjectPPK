import { convexTest } from "convex-test"
import { describe, expect, it, vi } from "vitest"

import { api, internal } from "./_generated/api"
import { AUTO_REJECTION_NOTE } from "./lib/reservationTime"
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
    const otherFacility = await ctx.db.insert("facilities", {
      name: "Lab",
      type: "Ruang",
      location: "Kampus",
      capacity: 20,
      description: "Lab",
      status: "active",
      createdBy: officer,
      createdAt: now,
      updatedAt: now,
    })
    return { user, officer, facility, otherFacility }
  })
  return { t, ...ids }
}

describe("reservation conflict rules", () => {
  it("approves one request, rejects overlapping pending requests, and blocks later submissions", async () => {
    const { t, facility, otherFacility } = await setup()
    const user = t.withIdentity({ subject: "user-auth" })
    const officer = t.withIdentity({ subject: "officer-auth" })
    const request = (facilityId: typeof facility, start: number, end: number) =>
      user.mutation(api.reservations.create, {
        facilityId,
        purpose: "Rapat",
        startAt: start,
        endAt: end,
      })
    const winner = await request(facility, startAt, startAt + 3600000)
    const sameTime = await request(facility, startAt, startAt + 3600000)
    const partial = await request(
      facility,
      startAt + 1800000,
      startAt + 5400000
    )
    const adjacent = await request(
      facility,
      startAt + 3600000,
      startAt + 5400000
    )
    const separate = await request(otherFacility, startAt, startAt + 3600000)

    await officer.mutation(api.reservations.decide, {
      reservationId: winner,
      decision: "approved",
    })
    const state = await t.run(async (ctx) => ({
      reservations: await ctx.db.query("reservations").collect(),
      events: await ctx.db.query("auditEvents").collect(),
    }))
    const byId = (id: typeof winner) =>
      state.reservations.find((item) => item._id === id)
    expect(byId(winner)?.status).toBe("approved")
    for (const id of [sameTime, partial]) {
      expect(byId(id)).toMatchObject({
        status: "rejected",
        decisionNote: AUTO_REJECTION_NOTE,
      })
    }
    expect(byId(adjacent)?.status).toBe("pending")
    expect(byId(separate)?.status).toBe("pending")
    expect(
      state.events.filter(
        (event) => event.action === "reservation.auto_rejected_conflict"
      )
    ).toHaveLength(2)
    await expect(request(facility, startAt, startAt + 1800000)).rejects.toThrow(
      "Slot sudah digunakan"
    )
    await officer.mutation(api.reservations.decide, {
      reservationId: adjacent,
      decision: "approved",
    })
    await officer.mutation(api.reservations.decide, {
      reservationId: separate,
      decision: "approved",
    })
  })

  it("reconciles old pending conflicts without changing approved reservations", async () => {
    const { t, user, facility } = await setup()
    const [approved, pending] = await t.run(async (ctx) => {
      const base = {
        userId: user,
        facilityId: facility,
        purpose: "Rapat",
        startAt,
        endAt: startAt + 3600000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      return [
        await ctx.db.insert("reservations", { ...base, status: "approved" }),
        await ctx.db.insert("reservations", { ...base, status: "pending" }),
      ] as const
    })
    const preview = await t.query(
      internal.reservations.previewPendingConflicts,
      {}
    )
    expect(preview.affectedIds).toEqual([pending])
    expect(preview.nextCursor).toBeNull()
    await t.mutation(internal.reservations.reconcilePendingConflicts, {})
    await t.mutation(internal.reservations.reconcilePendingConflicts, {})
    const result = await t.run(async (ctx) => ({
      approved: await ctx.db.get("reservations", approved),
      pending: await ctx.db.get("reservations", pending),
      events: await ctx.db.query("auditEvents").collect(),
    }))
    expect(result.approved?.status).toBe("approved")
    expect(result.pending).toMatchObject({
      status: "rejected",
      decisionNote: AUTO_REJECTION_NOTE,
    })
    expect(result.events).toHaveLength(1)
  })

  it("rejects an approval attempt when another approved reservation already occupies the slot", async () => {
    const { t, user, facility } = await setup()
    const pending = await t.run(async (ctx) => {
      const base = {
        userId: user,
        facilityId: facility,
        purpose: "Rapat",
        startAt,
        endAt: startAt + 3600000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await ctx.db.insert("reservations", { ...base, status: "approved" })
      return ctx.db.insert("reservations", { ...base, status: "pending" })
    })
    await t
      .withIdentity({ subject: "officer-auth" })
      .mutation(api.reservations.decide, {
        reservationId: pending,
        decision: "approved",
      })
    const result = await t.run(async (ctx) =>
      ctx.db.get("reservations", pending)
    )
    expect(result).toMatchObject({
      status: "rejected",
      decisionNote: AUTO_REJECTION_NOTE,
    })
  })

  it("continues reconciliation beyond the first batch", async () => {
    const { t, user, facility } = await setup()
    await t.run(async (ctx) => {
      const base = {
        userId: user,
        facilityId: facility,
        purpose: "Rapat",
        startAt,
        endAt: startAt + 3600000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await ctx.db.insert("reservations", { ...base, status: "approved" })
      for (let index = 0; index < 101; index++) {
        await ctx.db.insert("reservations", { ...base, status: "pending" })
      }
    })
    vi.useFakeTimers()
    try {
      const first = await t.mutation(
        internal.reservations.reconcilePendingConflicts,
        {}
      )
      expect(first).toMatchObject({ scanned: 100, rejected: 100, done: false })
      await t.finishAllScheduledFunctions(vi.runAllTimers)
    } finally {
      vi.useRealTimers()
    }
    const remaining = await t.run(async (ctx) =>
      ctx.db
        .query("reservations")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect()
    )
    expect(remaining).toHaveLength(0)
  })
})
