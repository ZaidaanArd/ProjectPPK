import { beforeEach, describe, expect, it, vi } from "vitest"
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
      note: "Diperiksa",
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
      "Aula Gedung A,Pengguna Demo,pengguna@demo.local,AC,Bocor"
    )
  })
})
