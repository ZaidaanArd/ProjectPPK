import { describe, expect, it } from "vitest"
import {
  changeDeadline,
  effectiveReservationStatus,
  jakartaDate,
  reservationDisplayStatus,
} from "../convex/lib/reservationState"

describe("reservation deadlines", () => {
  it("expires only pending bookings at their start, not by submission age", () => {
    expect(
      effectiveReservationStatus({ status: "pending", startAt: 100 }, 99)
    ).toBe("pending")
    expect(
      effectiveReservationStatus({ status: "pending", startAt: 100 }, 100)
    ).toBe("expired")
    expect(
      effectiveReservationStatus({ status: "approved", startAt: 100 }, 200)
    ).toBe("approved")
  })
  it("derives completed without changing the approved analytics status", () => {
    expect(
      reservationDisplayStatus(
        { status: "approved", startAt: 100, endAt: 200 },
        200
      )
    ).toBe("completed")
  })
  it("uses WIB at UTC date rollover and the earlier change deadline", () => {
    expect(jakartaDate(Date.parse("2026-10-10T18:00:00Z"))).toBe("2026-10-11")
    expect(changeDeadline({ originalStartAt: 200, startAt: 100 })).toBe(100)
    expect(changeDeadline({ originalStartAt: 100, startAt: 200 })).toBe(100)
  })
})
