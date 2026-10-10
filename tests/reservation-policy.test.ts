import { describe, expect, it } from "vitest"
import {
  meetsReservationLeadTime,
  RESERVATION_LEAD_MS,
} from "../convex/lib/reservationPolicy"
import { validateReservationLeadTime } from "../convex/lib/reservationTime"

describe("48-hour reservation boundary", () => {
  const now = Date.parse("2026-10-11T15:30:00+07:00")
  it("accepts exactly 48 hours and later, not two calendar dates", () => {
    expect(meetsReservationLeadTime(now + RESERVATION_LEAD_MS, now)).toBe(true)
    expect(meetsReservationLeadTime(now + RESERVATION_LEAD_MS + 1, now)).toBe(
      true
    )
    expect(meetsReservationLeadTime(now + RESERVATION_LEAD_MS - 1, now)).toBe(
      false
    )
    expect(
      meetsReservationLeadTime(Date.parse("2026-10-13T07:00:00+07:00"), now)
    ).toBe(false)
  })
  it("validates at the server and rejects invalid timestamps", () => {
    expect(() =>
      validateReservationLeadTime(now + RESERVATION_LEAD_MS, now)
    ).not.toThrow()
    expect(() =>
      validateReservationLeadTime(now + RESERVATION_LEAD_MS - 1, now)
    ).toThrow("48 jam")
    expect(meetsReservationLeadTime(NaN, now)).toBe(false)
  })
})
