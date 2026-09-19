import { describe, expect, it } from "vitest"

import {
  overlaps,
  validateReservationWindow,
} from "../convex/lib/reservationTime"

describe("reservation time rules", () => {
  it("accepts aligned slots inside campus operating hours", () => {
    expect(() =>
      validateReservationWindow(
        Date.parse("2026-09-21T00:00:00.000Z"),
        Date.parse("2026-09-21T01:30:00.000Z")
      )
    ).not.toThrow()
  })

  it("rejects a reservation outside 07.00–20.00 WIB", () => {
    expect(() =>
      validateReservationWindow(
        Date.parse("2026-09-20T23:30:00.000Z"),
        Date.parse("2026-09-21T00:30:00.000Z")
      )
    ).toThrow("07.00–20.00 WIB")
  })

  it("rejects timestamps that are not aligned to 30 minutes", () => {
    expect(() =>
      validateReservationWindow(
        Date.parse("2026-09-21T00:15:00.000Z"),
        Date.parse("2026-09-21T01:15:00.000Z")
      )
    ).toThrow("slot 30 menit")
  })

  it("detects overlap while allowing adjacent reservations", () => {
    expect(overlaps(100, 200, 150, 250)).toBe(true)
    expect(overlaps(100, 200, 200, 250)).toBe(false)
  })
})
