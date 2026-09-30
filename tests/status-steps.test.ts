import { describe, expect, it } from "vitest"

import { reportSteps, reservationSteps } from "../src/lib/status-steps"

const states = (steps: { state: string }[]) => steps.map((step) => step.state)

describe("reservationSteps", () => {
  it("marks review as current while pending", () => {
    const steps = reservationSteps({ status: "pending", createdAt: 1 })
    expect(states(steps)).toEqual(["done", "current", "upcoming"])
    expect(steps[0]?.at).toBe(1)
  })

  it("completes every step when approved", () => {
    const steps = reservationSteps({
      status: "approved",
      createdAt: 1,
      updatedAt: 5,
    })
    expect(states(steps)).toEqual(["done", "done", "done"])
    expect(steps[2]?.at).toBe(5)
  })

  it("ends in an error step when rejected or cancelled", () => {
    for (const [status, label] of [
      ["rejected", "Ditolak"],
      ["cancelled", "Dibatalkan"],
    ] as const) {
      const steps = reservationSteps({ status, createdAt: 1, updatedAt: 9 })
      expect(states(steps)).toEqual(["done", "done", "error"])
      expect(steps[2]).toMatchObject({ label, at: 9 })
    }
  })
})

describe("reportSteps", () => {
  it("follows pending, in progress, and resolved", () => {
    expect(states(reportSteps({ status: "pending", createdAt: 1 }))).toEqual([
      "current",
      "upcoming",
      "upcoming",
    ])
    expect(
      states(reportSteps({ status: "in_progress", createdAt: 1 }))
    ).toEqual(["done", "current", "upcoming"])
    expect(states(reportSteps({ status: "resolved", createdAt: 1 }))).toEqual([
      "done",
      "done",
      "done",
    ])
  })

  it("ends in Ditolak when rejected", () => {
    const steps = reportSteps({ status: "rejected", createdAt: 1 })
    expect(steps[2]).toMatchObject({ label: "Ditolak", state: "error" })
  })
})

describe("step timestamps", () => {
  it("does not repeat the submission time on later steps", () => {
    const pending = reservationSteps({
      status: "pending",
      createdAt: 1,
      updatedAt: 1,
    })
    expect(pending[1]?.at).toBeUndefined()
    const handled = reportSteps({
      status: "in_progress",
      createdAt: 1,
      updatedAt: 7,
    })
    expect(handled[1]?.at).toBe(7)
  })
})
