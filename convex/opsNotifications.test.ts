import { convexTest } from "convex-test"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api, internal } from "./_generated/api"
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

describe("ops notifications", () => {
  it("sends maintenance reminder idempotently and keeps owner-only access", async () => {
    const { t, facility } = await setup()
    const officer = t.withIdentity({ subject: "officer-auth" })
    const windowId = await officer.mutation(api.maintenance.schedule, {
      facilityId: facility,
      startAt,
      endAt: startAt + 3600000,
      reason: "Servis AC",
    })
    await t.mutation(internal.maintenance.remind, { windowId, endAt: startAt + 3600000 })
    await t.mutation(internal.maintenance.remind, { windowId, endAt: startAt + 3600000 })
    const notes = await t.run(async (ctx) => ctx.db.query("notifications").collect())
    expect(notes.filter((n) => n.type === "maintenance.reminder")).toHaveLength(1)
    const user = t.withIdentity({ subject: "user-auth" })
    await expect(user.query(api.notifications.listMine, {})).resolves.toEqual([])
    await expect(
      user.mutation(api.notifications.markRead, { notificationId: notes[0]._id })
    ).rejects.toThrow("tidak ditemukan")
  })

  it("dedupes disruption notifications per revision", async () => {
    const { t, facility } = await setup()
    const user = t.withIdentity({ subject: "user-auth" })
    await user.mutation(api.reservations.create, {
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
    await officer.mutation(api.facilityIssues.update, { issueId, description: "Bocor parah" })
    const notes = await t.run(async (ctx) => ctx.db.query("notifications").collect())
    expect(notes.filter((n) => n.type === "disruption.created")).toHaveLength(1)
    expect(notes.filter((n) => n.type === "disruption.updated")).toHaveLength(1)
  })
})
