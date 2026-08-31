import { describe, expect, it } from "vitest"

import {
  getReservationWindowIssue,
  registerInputSchema,
  reservationInputSchema,
} from "./index"

describe("reservation window", () => {
  it("accepts a 30-minute slot inside operating hours", () => {
    expect(
      getReservationWindowIssue(
        "2026-09-01T00:00:00.000Z",
        "2026-09-01T00:30:00.000Z"
      )
    ).toBeNull()
  })

  it("rejects slots before 07.00 WIB", () => {
    expect(
      getReservationWindowIssue(
        "2026-08-31T23:30:00.000Z",
        "2026-09-01T00:30:00.000Z"
      )
    ).toBe("outside-operating-hours")
  })

  it("rejects times that are not aligned to 30 minutes", () => {
    const result = reservationInputSchema.safeParse({
      facilityId: "019908f4-72b1-7000-8000-000000000001",
      purpose: "Diskusi persiapan kegiatan kampus",
      startTime: "2026-09-01T02:15:00.000Z",
      endTime: "2026-09-01T03:00:00.000Z",
    })

    expect(result.success).toBe(false)
  })
})

describe("registration", () => {
  it("requires matching password confirmation", () => {
    const result = registerInputSchema.safeParse({
      name: "Raka Pratama",
      email: "raka@example.com",
      password: "password-aman",
      passwordConfirmation: "berbeda-sekali",
    })

    expect(result.success).toBe(false)
  })
})
