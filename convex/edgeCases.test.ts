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
const now = Date.parse("2027-10-01T10:00:00+07:00")
const future = now + 3 * 86400000
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(now)
})
afterEach(() => vi.useRealTimers())

async function setup() {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const makeProfile = (id: string, role: "user" | "officer" | "admin") =>
      ctx.db.insert("profiles", {
        authUserId: id,
        name: id,
        email: `${id}@example.test`,
        role,
        status: "active",
        mustChangePassword: false,
        createdAt: now,
        updatedAt: now,
      })
    const userId = await makeProfile("user", "user")
    await makeProfile("other", "user")
    const officerId = await makeProfile("officer", "officer")
    await makeProfile("admin", "admin")
    const facilityId = await ctx.db.insert("facilities", {
      name: "Ruang QA",
      type: "Ruang",
      location: "Kampus",
      capacity: 20,
      description: "QA",
      status: "active",
      createdBy: officerId,
      createdAt: now,
      updatedAt: now,
    })
    const reportId = await ctx.db.insert("reports", {
      facilityId,
      reporterId: userId,
      category: "AC",
      description: "Laporan privat",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    return { facilityId, reportId, userId }
  })
  return {
    t,
    ...ids,
    user: t.withIdentity({ subject: "user" }),
    officer: t.withIdentity({ subject: "officer" }),
    admin: t.withIdentity({ subject: "admin" }),
  }
}

describe("reservation and repair edge cases", () => {
  it("enforces exactly 48 hours and retries the same booking after the cutoff", async () => {
    const { user, facilityId, t } = await setup()
    const args = {
      facilityId,
      purpose: "Rapat",
      startAt: now + 48 * 3600000,
      endAt: now + 49 * 3600000,
    }
    await expect(
      user.mutation(api.reservations.create, {
        ...args,
        startAt: args.startAt - 1800000,
      })
    ).rejects.toThrow("48 jam")
    const id = await user.mutation(api.reservations.create, args)
    vi.setSystemTime(now + 3600000)
    expect(await user.mutation(api.reservations.create, args)).toBe(id)
    expect(
      await t.run((ctx) => ctx.db.query("reservations").collect())
    ).toHaveLength(1)
  })
  it("does not start work without an impact and a separate public explanation", async () => {
    const { officer, reportId, t } = await setup()
    await expect(
      officer.mutation(api.reports.updateStatus, {
        reportId,
        status: "in_progress",
        note: "",
      })
    ).rejects.toThrow("dampak")
    await expect(
      officer.mutation(api.reports.updateStatus, {
        reportId,
        status: "in_progress",
        note: "",
        handlingImpact: "usable",
      })
    ).rejects.toThrow("publik")
    expect(
      (await t.run((ctx) => ctx.db.get("reports", reportId)))?.status
    ).toBe("pending")
  })
  it("keeps usable repairs bookable, notifies later applicants, and deduplicates retries", async () => {
    const { officer, reportId, facilityId, user, t } = await setup()
    const args = {
      reportId,
      status: "in_progress" as const,
      note: "",
      handlingImpact: "usable" as const,
      publicNotice: "AC diperbaiki; ruangan tetap aman.",
    }
    await officer.mutation(api.reports.updateStatus, args)
    await officer.mutation(api.reports.updateStatus, args)
    const id = await user.mutation(api.reservations.create, {
      facilityId,
      purpose: "Rapat",
      startAt: future,
      endAt: future + 3600000,
    })
    const notices = await user.query(api.notifications.listMine, {})
    expect(
      notices.filter((n) => n.issueId && n.reservationId === id)
    ).toHaveLength(1)
    expect(JSON.stringify(notices)).not.toContain("Laporan privat")
    expect(
      await t.run((ctx) => ctx.db.query("facilityIssues").collect())
    ).toHaveLength(1)
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "resolved",
      note: "Selesai",
    })
    expect(
      (await t.run((ctx) => ctx.db.query("facilityIssues").first()))?.status
    ).toBe("closed")
  })
  it("closes immediately, cancels affected bookings, and needs a safety confirmation to reopen", async () => {
    const { t, userId, officer, user, facilityId, reportId } = await setup()
    const bookingId = await user.mutation(api.reservations.create, {
      facilityId,
      purpose: "Rapat",
      startAt: future,
      endAt: future + 3600000,
    })
    const ongoingId = await t.run((ctx) =>
      ctx.db.insert("reservations", {
        userId,
        facilityId,
        purpose: "Sedang berjalan",
        startAt: now - 1800000,
        endAt: now + 1800000,
        status: "approved",
        createdAt: now,
        updatedAt: now,
      })
    )
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "in_progress",
      note: "",
      handlingImpact: "closed",
      publicNotice: "Atap tidak aman.",
    })
    expect(
      (await t.run((ctx) => ctx.db.get("reservations", bookingId)))?.status
    ).toBe("cancelled")
    expect(
      (await t.run((ctx) => ctx.db.get("reservations", ongoingId)))?.status
    ).toBe("cancelled")
    const closure = (
      await officer.query(api.emergencyClosures.listManaged, {})
    )[0]
    await expect(
      officer.mutation(api.emergencyClosures.reopen, {
        closureId: closure.id,
        confirmSafe: true,
      })
    ).rejects.toThrow("Selesaikan penanganan")
    vi.setSystemTime(now + 30 * 86400000)
    expect(
      await user.query(api.emergencyClosures.listActiveForFacility, {
        facilityId,
      })
    ).toHaveLength(1)
    await expect(
      officer.mutation(api.reports.updateStatus, {
        reportId,
        status: "resolved",
        note: "Selesai",
      })
    ).rejects.toThrow("aman")
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "resolved",
      note: "Atap sudah aman",
      confirmSafe: true,
    })
    expect(
      await user.query(api.emergencyClosures.listActiveForFacility, {
        facilityId,
      })
    ).toHaveLength(0)
    expect(
      (await t.run((ctx) => ctx.db.get("reservations", bookingId)))?.status
    ).toBe("cancelled")
    expect(
      (await user.query(api.notifications.listMine, {})).some(
        (n) => n.type === "emergency.reopened"
      )
    ).toBe(true)
  })
  it("does not reopen while a second closed-impact report is still being handled", async () => {
    const { t, userId, officer, facilityId, reportId } = await setup()
    const second = await t.run((ctx) =>
      ctx.db.insert("reports", {
        reporterId: userId,
        facilityId,
        category: "Atap",
        description: "QA",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
    )
    for (const id of [reportId, second])
      await officer.mutation(api.reports.updateStatus, {
        reportId: id,
        status: "in_progress",
        note: "",
        handlingImpact: "closed",
        publicNotice: "Tidak aman",
      })
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "resolved",
      note: "AC selesai",
      confirmSafe: true,
    })
    expect(
      await officer.query(api.emergencyClosures.listActiveForFacility, {
        facilityId,
      })
    ).toHaveLength(1)
    await officer.mutation(api.reports.updateStatus, {
      reportId: second,
      status: "resolved",
      note: "Atap selesai",
      confirmSafe: true,
    })
    expect(
      await officer.query(api.emergencyClosures.listActiveForFacility, {
        facilityId,
      })
    ).toHaveLength(0)
  })
  it("retains a manual closure after report completion", async () => {
    const { officer, facilityId, reportId } = await setup()
    await officer.mutation(api.emergencyClosures.close, {
      facilityId,
      reason: "Pemeriksaan gedung",
      mode: "safety",
      estimatedEndAt: now + 3600000,
    })
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "in_progress",
      note: "",
      handlingImpact: "closed",
      publicNotice: "Pekerjaan",
    })
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "resolved",
      note: "Selesai",
      confirmSafe: true,
    })
    expect(
      await officer.query(api.emergencyClosures.listActiveForFacility, {
        facilityId,
      })
    ).toHaveLength(1)
  })
  it("escalates a manual long repair to safety and cancels retained bookings", async () => {
    const { t, userId, officer, facilityId, reportId } = await setup()
    const reservationId = await t.run((ctx) =>
      ctx.db.insert("reservations", {
        userId,
        facilityId,
        purpose: "QA",
        status: "approved",
        startAt: future,
        endAt: future + 3600000,
        createdAt: now,
        updatedAt: now,
      })
    )
    const closureId = await officer.mutation(api.emergencyClosures.close, {
      facilityId,
      reason: "Perbaikan besar",
      mode: "long_repair",
    })
    expect(
      (await t.run((ctx) => ctx.db.get("reservations", reservationId)))?.status
    ).toBe("approved")
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "in_progress",
      note: "",
      handlingImpact: "closed",
      publicNotice: "Bangunan tidak aman",
    })
    expect(
      (await t.run((ctx) => ctx.db.get("reservations", reservationId)))?.status
    ).toBe("cancelled")
    expect(
      await t.run((ctx) => ctx.db.get("emergencyClosures", closureId))
    ).toMatchObject({ mode: "safety", source: "manual", status: "closed" })
    await officer.mutation(api.reports.updateStatus, {
      reportId,
      status: "resolved",
      note: "Selesai",
      confirmSafe: true,
    })
    expect(
      (await t.run((ctx) => ctx.db.get("emergencyClosures", closureId)))?.status
    ).toBe("closed")
  })
  it("excludes expired requests from a closure impact preview", async () => {
    const { t, userId, officer, facilityId } = await setup()
    await t.run((ctx) =>
      ctx.db.insert("reservations", {
        userId,
        facilityId,
        purpose: "Lama",
        status: "pending",
        startAt: now - 60000,
        endAt: now + 3600000,
        createdAt: now,
        updatedAt: now,
      })
    )
    expect(
      await officer.query(api.emergencyClosures.previewImpact, { facilityId })
    ).toEqual({ pending: [], approvedFuture: [], ongoing: [] })
  })
  it("pages notification history without exposing another account", async () => {
    const { t, userId, user } = await setup()
    await t.run(async (ctx) => {
      for (let i = 0; i < 25; i++)
        await ctx.db.insert("notifications", {
          userId,
          type: "reservation.approved",
          title: `QA ${i}`,
          body: "QA",
          dedupKey: `QA:${i}`,
          createdAt: now + i,
        })
    })
    const first = await user.query(api.notifications.listPage, {
      paginationOpts: { cursor: null, numItems: 20 },
    })
    const second = await user.query(api.notifications.listPage, {
      paginationOpts: { cursor: first.continueCursor, numItems: 20 },
    })
    expect(first.page).toHaveLength(20)
    expect(second.page).toHaveLength(5)
    expect(
      await t
        .withIdentity({ subject: "other" })
        .query(api.notifications.listPage, {
          paginationOpts: { cursor: null, numItems: 20 },
        })
    ).toMatchObject({ page: [] })
  })
})
