import { convexTest } from "convex-test"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(startAt - 86400000)
})
afterEach(() => vi.useRealTimers())

describe("reservation deadline and retry rules", () => {
  it("deduplicates exact retries but permits another user's pending request", async () => {
    const { t, facility } = await setup()
    const args = {
      facilityId: facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    }
    const user = t.withIdentity({ subject: "user-auth" })
    const first = await user.mutation(api.reservations.create, args)
    expect(await user.mutation(api.reservations.create, args)).toBe(first)
    const other = await t
      .withIdentity({ subject: "other-user-auth" })
      .mutation(api.reservations.create, args)
    expect(other).not.toBe(first)
  })
  it("refuses elapsed approval even when the scheduler has not run", async () => {
    const { t, facility } = await setup()
    const id = await t
      .withIdentity({ subject: "user-auth" })
      .mutation(api.reservations.create, {
        facilityId: facility,
        purpose: "Rapat",
        startAt,
        endAt: startAt + 3600000,
      })
    vi.useFakeTimers()
    vi.setSystemTime(startAt)
    await expect(
      t
        .withIdentity({ subject: "officer-auth" })
        .mutation(api.reservations.decide, {
          reservationId: id,
          decision: "approved",
        })
    ).rejects.toThrow("kedaluwarsa")
    expect(
      (
        await t
          .withIdentity({ subject: "user-auth" })
          .query(api.reservations.listMine, {})
      )[0]?.status
    ).toBe("expired")
    expect(
      (await t.query(internal.reservations.previewExpiredPending, {}))
        .affectedIds
    ).toEqual([id])
    await t.mutation(internal.reservations.expire, { reservationId: id })
    await t.mutation(internal.reservations.expire, { reservationId: id })
    expect(
      await t.run((ctx) => ctx.db.query("auditEvents").collect())
    ).toHaveLength(2)
  })
  it("serializes competing approvals to a single winner", async () => {
    const { t, facility } = await setup()
    const args = {
      facilityId: facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    }
    const a = await t
      .withIdentity({ subject: "user-auth" })
      .mutation(api.reservations.create, args)
    const b = await t
      .withIdentity({ subject: "other-user-auth" })
      .mutation(api.reservations.create, args)
    const officer = t.withIdentity({ subject: "officer-auth" })
    await Promise.allSettled(
      [a, b].map((reservationId) =>
        officer.mutation(api.reservations.decide, {
          reservationId,
          decision: "approved",
        })
      )
    )
    expect(
      (await officer.query(api.reservations.listQueue, {})).filter(
        (item) => item.status === "approved"
      )
    ).toHaveLength(1)
  })
})

describe("schedule changes", () => {
  async function approved() {
    const context = await setup()
    const user = context.t.withIdentity({ subject: "user-auth" })
    const officer = context.t.withIdentity({ subject: "officer-auth" })
    const id = await user.mutation(api.reservations.create, {
      facilityId: context.facility,
      purpose: "Rapat",
      startAt,
      endAt: startAt + 3600000,
    })
    await officer.mutation(api.reservations.decide, {
      reservationId: id,
      decision: "approved",
    })
    return { ...context, user, officer, id }
  }
  const proposed = {
    startAt: startAt + 7200000,
    endAt: startAt + 10800000,
    reason: "Perubahan kegiatan",
  }
  it("blocks new changes and approvals during closure without releasing the original booking", async () => {
    const { t, user, officer, id, facility } = await approved()
    const changeId = await user.mutation(
      api.reservations.requestScheduleChange,
      {
        reservationId: id,
        ...proposed,
      }
    )
    await t.run(async (ctx) =>
      ctx.db.insert("reports", {
        reporterId: (await ctx.db.get("reservations", id))!.userId,
        facilityId: facility,
        category: "Perbaikan",
        description: "Fasilitas ditutup",
        status: "in_progress",
        handlingImpact: "closed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    )
    await expect(
      officer.mutation(api.reservations.decideScheduleChange, {
        changeId,
        decision: "approved",
      })
    ).rejects.toThrow("fasilitas sedang tidak aktif")
    await user.mutation(api.reservations.cancelScheduleChange, { changeId })
    await expect(
      user.mutation(api.reservations.requestScheduleChange, {
        reservationId: id,
        ...proposed,
      })
    ).rejects.toThrow("fasilitas sedang tidak aktif")
    expect((await user.query(api.reservations.listMine, {}))[0]).toMatchObject({
      status: "approved",
      startAt,
    })
  })
  it("keeps old booking locked, publishes private pending hints, then replaces atomically", async () => {
    const { t, user, officer, id, facility } = await approved()
    const changeId = await user.mutation(
      api.reservations.requestScheduleChange,
      { reservationId: id, ...proposed }
    )
    expect((await user.query(api.reservations.listMine, {}))[0]?.startAt).toBe(
      startAt
    )
    const availability = await t.query(api.facilities.getPublicAvailability, {
      facilityId: facility,
      rangeStart: startAt,
      rangeEnd: startAt + 86400000,
    })
    expect(availability.pending).toEqual([
      { startAt: proposed.startAt, endAt: proposed.endAt },
    ])
    expect(Object.keys(availability.pending[0] ?? {}).sort()).toEqual([
      "endAt",
      "startAt",
    ])
    await officer.mutation(api.reservations.decideScheduleChange, {
      changeId,
      decision: "approved",
    })
    expect((await user.query(api.reservations.listMine, {}))[0]).toMatchObject({
      status: "approved",
      startAt: proposed.startAt,
      endAt: proposed.endAt,
    })
  })
  it("limits to one request and prevents a different user cancelling or creating changes", async () => {
    const { t, user, id } = await approved()
    const args = { reservationId: id, ...proposed }
    const changeId = await user.mutation(
      api.reservations.requestScheduleChange,
      args
    )
    await expect(
      user.mutation(api.reservations.requestScheduleChange, args)
    ).rejects.toThrow("Masih ada perubahan")
    const other = t.withIdentity({ subject: "other-user-auth" })
    expect(await other.query(api.reservations.listScheduleChanges, {})).toEqual(
      []
    )
    await expect(
      other.mutation(api.reservations.cancelScheduleChange, { changeId })
    ).rejects.toThrow("tidak ditemukan")
    await expect(
      other.mutation(api.reservations.requestScheduleChange, args)
    ).rejects.toThrow("Hanya reservasi")
  })
  it("retains original after rejection, cancellation and expiration", async () => {
    const { t, user, officer, id } = await approved()
    let changeId = await user.mutation(api.reservations.requestScheduleChange, {
      reservationId: id,
      ...proposed,
    })
    await expect(
      officer.mutation(api.reservations.decideScheduleChange, {
        changeId,
        decision: "rejected",
      })
    ).rejects.toThrow("Alasan")
    await officer.mutation(api.reservations.decideScheduleChange, {
      changeId,
      decision: "rejected",
      note: "Jadwal tidak sesuai",
    })
    changeId = await user.mutation(api.reservations.requestScheduleChange, {
      reservationId: id,
      ...proposed,
    })
    await user.mutation(api.reservations.cancelScheduleChange, { changeId })
    changeId = await user.mutation(api.reservations.requestScheduleChange, {
      reservationId: id,
      ...proposed,
    })
    vi.setSystemTime(startAt)
    await expect(
      officer.mutation(api.reservations.decideScheduleChange, {
        changeId,
        decision: "approved",
      })
    ).rejects.toThrow("kedaluwarsa")
    await t.mutation(internal.reservations.expireScheduleChange, { changeId })
    expect((await user.query(api.reservations.listMine, {}))[0]?.startAt).toBe(
      startAt
    )
  })
  it("rejects a proposal when another booking wins, without cancelling the old booking", async () => {
    const { t, user, officer, id, facility } = await approved()
    const changeId = await user.mutation(
      api.reservations.requestScheduleChange,
      { reservationId: id, ...proposed }
    )
    const competing = await t
      .withIdentity({ subject: "other-user-auth" })
      .mutation(api.reservations.create, {
        facilityId: facility,
        purpose: "Rapat",
        startAt: proposed.startAt,
        endAt: proposed.endAt,
      })
    await officer.mutation(api.reservations.decide, {
      reservationId: competing,
      decision: "approved",
    })
    expect(
      (await user.query(api.reservations.listScheduleChanges, {}))[0]
    ).toMatchObject({ id: changeId, status: "rejected" })
    expect((await user.query(api.reservations.listMine, {}))[0]?.startAt).toBe(
      startAt
    )
  })
  it("cancels pending proposals when the original is cancelled", async () => {
    const { user, id } = await approved()
    await user.mutation(api.reservations.requestScheduleChange, {
      reservationId: id,
      ...proposed,
    })
    await user.mutation(api.reservations.cancelMine, { reservationId: id })
    expect(
      (await user.query(api.reservations.listScheduleChanges, {}))[0]?.status
    ).toBe("cancelled")
  })
})

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
    const sameTime = await t
      .withIdentity({ subject: "other-user-auth" })
      .mutation(api.reservations.create, {
        facilityId: facility,
        purpose: "Rapat lain",
        startAt,
        endAt: startAt + 3600000,
      })
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
