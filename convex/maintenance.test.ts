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

const HOUR = 60 * 60 * 1000
// Monday 1 November 2027, 10.00 WIB.
const at = (time: string) => Date.parse(`2027-11-01T${time}:00+07:00`)

async function setup() {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const now = Date.now()
    const profile = (authUserId: string, role: "user" | "officer" | "admin") =>
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
    await profile("admin-auth", "admin")
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
    const report = await ctx.db.insert("reports", {
      reporterId: user,
      facilityId: facility,
      category: "AC",
      description: "AC mati",
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    })
    return { facility, report }
  })
  const user = t.withIdentity({ subject: "user-auth" })
  const officer = t.withIdentity({ subject: "officer-auth" })
  const admin = t.withIdentity({ subject: "admin-auth" })
  const reserve = (start: string, end: string) =>
    user.mutation(api.reservations.create, {
      facilityId: ids.facility,
      purpose: "Rapat",
      startAt: at(start),
      endAt: at(end),
    })
  const schedule = (start: string, end: string, reportId = ids.report) =>
    officer.mutation(api.maintenance.schedule, {
      facilityId: ids.facility,
      startAt: at(start),
      endAt: at(end),
      reason: "Ganti AC",
      reportId,
    })
  return { t, user, officer, admin, reserve, schedule, ...ids }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(Date.parse("2027-10-25T08:00:00+07:00"))
})
afterEach(() => {
  vi.useRealTimers()
})

describe("maintenance scheduling", () => {
  it("only takes free time: approved and pending reservations and other repairs block it", async () => {
    const { officer, reserve, schedule } = await setup()
    const approved = await reserve("08:00", "10:00")
    await officer.mutation(api.reservations.decide, {
      reservationId: approved,
      decision: "approved",
    })
    await reserve("14:00", "15:00")

    await expect(schedule("09:00", "11:00")).rejects.toThrow(
      "Bentrok dengan 1 reservasi disetujui (01/11 08.00–10.00)"
    )
    await expect(schedule("13:00", "14:30")).rejects.toThrow(
      "Ada 1 reservasi menunggu di waktu ini (01/11 14.00–15.00). Setujui atau tolak dulu"
    )

    // Back to back with the approved booking is fine.
    await schedule("10:00", "12:00")
    await expect(schedule("11:30", "12:30")).rejects.toThrow(
      "Sudah ada jadwal perbaikan di waktu ini"
    )
  })

  it("blocks reservations only inside the window and reopens slots when cancelled", async () => {
    const { officer, reserve, schedule } = await setup()
    const windowId = await schedule("10:00", "12:00")

    await expect(reserve("11:00", "13:00")).rejects.toThrow(
      "Slot bertepatan dengan jadwal perbaikan (01/11 10.00–12.00)"
    )
    // Before and after the repair the facility stays bookable.
    await reserve("08:00", "10:00")
    await reserve("12:00", "13:00")

    expect(await officer.mutation(api.maintenance.close, { windowId })).toBe(
      "cancelled"
    )
    await reserve("10:00", "11:00")
  })

  it("extends only into free time", async () => {
    const { officer, reserve, schedule } = await setup()
    const windowId = await schedule("10:00", "12:00")
    const later = await reserve("14:00", "15:00")
    await officer.mutation(api.reservations.decide, {
      reservationId: later,
      decision: "approved",
    })

    await expect(
      officer.mutation(api.maintenance.extend, { windowId, endAt: at("15:00") })
    ).rejects.toThrow("Bentrok dengan 1 reservasi disetujui")
    await officer.mutation(api.maintenance.extend, {
      windowId,
      endAt: at("14:00"),
    })
    await expect(reserve("13:00", "13:30")).rejects.toThrow(
      "jadwal perbaikan (01/11 10.00–14.00)"
    )
  })

  it("completes a started window early, and on schedule otherwise", async () => {
    const { t, officer, reserve, schedule } = await setup()
    const early = await schedule("10:00", "12:00")
    const onTime = await schedule("13:00", "14:00")

    vi.setSystemTime(at("11:00"))
    expect(
      await officer.mutation(api.maintenance.close, { windowId: early })
    ).toBe("completed")
    await reserve("11:30", "12:00")

    vi.setSystemTime(at("14:00"))
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const windows = await t.run((ctx) =>
      ctx.db.query("maintenanceWindows").collect()
    )
    expect(windows.find((row) => row._id === early)).toMatchObject({
      status: "completed",
      endAt: at("11:00"),
    })
    expect(windows.find((row) => row._id === onTime)?.status).toBe("completed")
  })

  it("ends a report's repairs when the report is resolved", async () => {
    const { t, officer, schedule, report } = await setup()
    const started = await schedule("10:00", "12:00")
    const future = await schedule("13:00", "14:00")

    vi.setSystemTime(at("10:30"))
    await officer.mutation(api.reports.updateStatus, {
      reportId: report,
      status: "resolved",
      note: "AC sudah diganti",
    })
    const windows = await t.run((ctx) =>
      ctx.db.query("maintenanceWindows").collect()
    )
    expect(windows.find((row) => row._id === started)).toMatchObject({
      status: "completed",
      endAt: at("10:30"),
    })
    expect(windows.find((row) => row._id === future)?.status).toBe("cancelled")
    await expect(schedule("15:00", "16:00")).rejects.toThrow(
      "Laporan ini sudah ditutup"
    )
  })

  it("rejects malformed windows", async () => {
    const { schedule } = await setup()
    await expect(schedule("10:15", "11:00")).rejects.toThrow("slot 30 menit")
    await expect(schedule("11:00", "10:00")).rejects.toThrow(
      "Waktu selesai harus setelah waktu mulai"
    )
    vi.setSystemTime(at("12:00"))
    await expect(schedule("10:00", "13:00")).rejects.toThrow("sudah lewat")
    // The current slot may still be chosen.
    vi.setSystemTime(at("12:10"))
    await schedule("12:00", "13:00")
    await expect(schedule("14:00", "14:00")).rejects.toThrow(
      "Waktu selesai harus setelah waktu mulai"
    )
  })

  it("caps a window at seven days", async () => {
    const { officer, facility } = await setup()
    await expect(
      officer.mutation(api.maintenance.schedule, {
        facilityId: facility,
        startAt: at("10:00"),
        endAt: at("10:00") + 7 * 24 * HOUR + 30 * 60 * 1000,
        reason: "Renovasi",
      })
    ).rejects.toThrow("maksimal 7 hari")
  })

  it("shows the repair to the public and no longer sets whole-facility maintenance", async () => {
    const { t, admin, schedule, facility } = await setup()
    await schedule("10:00", "12:00")

    const listed = await t.query(api.facilities.listPublic, {})
    expect(listed[0]?.nextMaintenance).toEqual({
      startAt: at("10:00"),
      endAt: at("12:00"),
    })
    const availability = await t.query(api.facilities.getPublicAvailability, {
      facilityId: facility,
      rangeStart: at("07:00"),
      rangeEnd: at("20:00"),
    })
    expect(availability.maintenance).toEqual([
      { startAt: at("10:00"), endAt: at("12:00") },
    ])

    await expect(
      admin.mutation(api.facilities.setStatus, {
        facilityId: facility,
        status: "maintenance",
      })
    ).rejects.toThrow("Gunakan Jadwal perbaikan")
  })

  it("is staff only", async () => {
    const { user, facility } = await setup()
    await expect(
      user.mutation(api.maintenance.schedule, {
        facilityId: facility,
        startAt: at("10:00"),
        endAt: at("11:00"),
        reason: "Iseng",
      })
    ).rejects.toThrow("tidak memiliki izin")
  })
})
