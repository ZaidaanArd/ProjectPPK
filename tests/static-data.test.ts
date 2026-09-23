import { beforeEach, describe, expect, it, vi } from "vitest"
import { AUTO_REJECTION_NOTE } from "../convex/lib/reservationTime"
import {
  getStaticData,
  resetStaticData,
  staticCsv,
  staticMutation,
  staticQuery,
} from "../src/lib/static-data"

function role(value: string) {
  vi.stubGlobal("document", { cookie: `sthana_demo_role=${value}` })
}

beforeEach(async () => {
  await resetStaticData()
  role("user")
})

describe("static data mode", () => {
  it("lets staff cancel a pending request only with a reason", async () => {
    role("officer")
    await expect(
      staticMutation("reservations:cancelByStaff", {
        reservationId: "demo-reservation-pending",
        reason: "",
      })
    ).rejects.toThrow("Kolom wajib diisi")
    await staticMutation("reservations:cancelByStaff", {
      reservationId: "demo-reservation-pending",
      reason: "Pemohon membatalkan kegiatan",
    })
    expect(
      getStaticData().reservations.find(
        (item) => item.id === "demo-reservation-pending"
      )
    ).toMatchObject({
      status: "cancelled",
      decisionNote: "Pemohon membatalkan kegiatan",
    })
  })

  it("shares a reservation across user, staff, and public availability", async () => {
    const startAt = Date.parse("2026-10-01T11:00:00+07:00")
    const endAt = startAt + 30 * 60 * 1000
    const id = await staticMutation("reservations:create", {
      facilityId: "demo-aula",
      purpose: "Rapat tim",
      startAt,
      endAt,
    })
    expect(
      (staticQuery("reservations:listMine", {}) as { id: string }[]).some(
        (item) => item.id === id
      )
    ).toBe(true)
    role("officer")
    await staticMutation("reservations:decide", {
      reservationId: id,
      decision: "approved",
    })
    const availability = staticQuery("facilities:getPublicAvailability", {
      facilityId: "demo-aula",
      rangeStart: startAt,
      rangeEnd: endAt,
    }) as { reservations: unknown[] }
    expect(availability.reservations).toHaveLength(1)
  })

  it("rejects overlapping pending requests when one is approved", async () => {
    const startAt = Date.parse("2027-10-01T10:00:00+07:00")
    const request = (facilityId: string, start: number, end: number) =>
      staticMutation("reservations:create", {
        facilityId,
        purpose: "Rapat",
        startAt: start,
        endAt: end,
      }) as Promise<string>
    const winner = await request("demo-aula", startAt, startAt + 3600000)
    const sameTime = await request("demo-aula", startAt, startAt + 3600000)
    const partial = await request(
      "demo-aula",
      startAt + 1800000,
      startAt + 5400000
    )
    const adjacent = await request(
      "demo-aula",
      startAt + 3600000,
      startAt + 5400000
    )
    const otherFacility = await request("demo-lab", startAt, startAt + 3600000)

    role("officer")
    await staticMutation("reservations:decide", {
      reservationId: winner,
      decision: "approved",
    })
    const byId = (id: string) =>
      getStaticData().reservations.find((item) => item.id === id)
    expect(byId(winner)?.status).toBe("approved")
    for (const id of [sameTime, partial]) {
      expect(byId(id)).toMatchObject({
        status: "rejected",
        decisionNote: AUTO_REJECTION_NOTE,
      })
    }
    expect(byId(adjacent)?.status).toBe("pending")
    expect(byId(otherFacility)?.status).toBe("pending")
    await staticMutation("reservations:decide", {
      reservationId: adjacent,
      decision: "approved",
    })
    await staticMutation("reservations:decide", {
      reservationId: otherFacility,
      decision: "approved",
    })
    role("user")
    await expect(
      request("demo-aula", startAt, startAt + 1800000)
    ).rejects.toThrow("Slot sudah digunakan")
  })

  it("automatically rejects a pending approval when an approved slot already exists", async () => {
    const approved = getStaticData().reservations.find(
      (item) => item.status === "approved"
    )!
    const id = "legacy-overlap"
    getStaticData().reservations.push({
      ...approved,
      id,
      status: "pending",
    })
    role("officer")
    await staticMutation("reservations:decide", {
      reservationId: id,
      decision: "approved",
    })
    expect(
      getStaticData().reservations.find((item) => item.id === id)
    ).toMatchObject({
      status: "rejected",
      decisionNote: AUTO_REJECTION_NOTE,
    })
  })

  it("reconciles old browser data on hydration and persists the rejection", async () => {
    vi.resetModules()
    const { initialStaticData, hydrateStaticData, getStaticData } =
      await import("../src/lib/static-data")
    const approved = initialStaticData.reservations.find(
      (item) => item.status === "approved"
    )!
    const stored = structuredClone(initialStaticData)
    stored.reservations.push({
      ...approved,
      id: "old-pending",
      status: "pending",
    })
    let saved = JSON.stringify(stored)
    vi.stubGlobal("window", {})
    vi.stubGlobal("localStorage", {
      getItem: () => saved,
      setItem: (_key: string, value: string) => {
        saved = value
      },
    })
    await hydrateStaticData()
    expect(
      getStaticData().reservations.find((item) => item.id === "old-pending")
    ).toMatchObject({ status: "rejected", decisionNote: AUTO_REJECTION_NOTE })
    expect(
      JSON.parse(saved).reservations.find(
        (item: { id: string }) => item.id === "old-pending"
      )
    ).toMatchObject({ status: "rejected", decisionNote: AUTO_REJECTION_NOTE })
    vi.unstubAllGlobals()
  })

  it("updates reports and facility status across roles, then resets", async () => {
    const id = await staticMutation("reports:create", {
      facilityId: "demo-aula",
      category: "AC",
      description: "Tidak dingin",
    })
    role("officer")
    await staticMutation("reports:updateStatus", {
      reportId: id,
      status: "in_progress",
      note: "",
      facilityMaintenance: true,
    })
    expect(
      (
        staticQuery("reports:listQueue", {}) as { id: string; status: string }[]
      ).find((item) => item.id === id)?.status
    ).toBe("in_progress")
    expect(
      getStaticData().facilities.find((facility) => facility.id === "demo-aula")
        ?.status
    ).toBe("maintenance")
    await expect(
      staticMutation("reports:updateStatus", {
        reportId: id,
        status: "resolved",
        note: "",
        facilityMaintenance: false,
      })
    ).rejects.toThrow("Catatan wajib diisi")
    await staticMutation("reports:updateStatus", {
      reportId: id,
      status: "resolved",
      note: "AC sudah diperbaiki",
      facilityMaintenance: false,
    })
    expect(
      getStaticData().facilities.find((facility) => facility.id === "demo-aula")
        ?.status
    ).toBe("active")
    await resetStaticData()
    expect(getStaticData().reports.some((report) => report.id === id)).toBe(
      false
    )
    expect(
      getStaticData().facilities.find((facility) => facility.id === "demo-aula")
        ?.status
    ).toBe("active")
  })

  it("exports current demo data as CSV", async () => {
    await staticMutation("reports:create", {
      facilityId: "demo-aula",
      category: "AC",
      description: "Bocor",
    })
    expect(staticCsv("reports")).toContain(
      '"Aula Gedung A","Pengguna Demo","pengguna@demo.local","AC","Bocor"'
    )
    expect(staticCsv("summary")).toContain('"Aula Gedung A"')
    expect(staticCsv("summary")).toContain('"1"')
  })
})
