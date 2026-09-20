import { describe, expect, it } from "vitest"

import {
  assertFacilityCanApprove,
  assertReportTransition,
} from "../convex/lib/workflows"

describe("reservation approval workflow", () => {
  it("only permits approval for active facilities", () => {
    expect(() => assertFacilityCanApprove("active")).not.toThrow()
    expect(() => assertFacilityCanApprove("maintenance")).toThrow(
      "fasilitas sedang tidak aktif"
    )
    expect(() => assertFacilityCanApprove("inactive")).toThrow(
      "fasilitas sedang tidak aktif"
    )
  })
})

describe("report status workflow", () => {
  it("permits the pending and in-progress lifecycle", () => {
    expect(() => assertReportTransition("pending", "in_progress")).not.toThrow()
    expect(() => assertReportTransition("pending", "rejected")).not.toThrow()
    expect(() =>
      assertReportTransition("in_progress", "resolved")
    ).not.toThrow()
    expect(() =>
      assertReportTransition("in_progress", "rejected")
    ).not.toThrow()
  })

  it("rejects skipped, repeated, and terminal transitions", () => {
    const message = "Status laporan tidak dapat diubah"
    expect(() => assertReportTransition("pending", "resolved")).toThrow(message)
    expect(() => assertReportTransition("in_progress", "in_progress")).toThrow(
      message
    )
    expect(() => assertReportTransition("resolved", "in_progress")).toThrow(
      message
    )
    expect(() => assertReportTransition("rejected", "in_progress")).toThrow(
      message
    )
  })
})
