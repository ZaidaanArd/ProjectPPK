import { describe, expect, it } from "vitest"

import {
  daySlots,
  displayDuration,
  rangeIsBusy,
  selectSlot,
  toTimestamp,
} from "../src/lib/reservation-slots"

const date = "2026-10-01"
const busy = [
  { startAt: toTimestamp(date, "09:00"), endAt: toTimestamp(date, "10:00") },
]

describe("daySlots", () => {
  it("lists 26 half-hour slots and marks busy ones", () => {
    const slots = daySlots(date, busy)
    expect(slots).toHaveLength(26)
    expect(slots[0]).toEqual({ start: "07:00", end: "07:30", taken: false })
    expect(
      slots.filter((slot) => slot.taken).map((slot) => slot.start)
    ).toEqual(["09:00", "09:30"])
  })
})

describe("selectSlot", () => {
  const slots = daySlots(date, busy)
  const index = (start: string) =>
    slots.findIndex((slot) => slot.start === start)

  it("starts a range on the first click and extends on the second", () => {
    const first = selectSlot(slots, { start: "", end: "" }, index("10:00"))
    expect(first).toEqual({ start: "10:00", end: "10:30", blocked: false })
    const second = selectSlot(slots, first, index("11:00"))
    expect(second).toEqual({ start: "10:00", end: "11:30", blocked: false })
  })

  it("restarts when clicking before the start or after a finished range", () => {
    const range = { start: "10:00", end: "11:30" }
    expect(selectSlot(slots, range, index("08:00"))).toMatchObject({
      start: "08:00",
      end: "08:30",
    })
    expect(selectSlot(slots, range, index("13:00"))).toMatchObject({
      start: "13:00",
      end: "13:30",
    })
  })

  it("blocks taken slots and ranges crossing them", () => {
    expect(
      selectSlot(slots, { start: "", end: "" }, index("09:00")).blocked
    ).toBe(true)
    const start = { start: "08:00", end: "08:30" }
    expect(selectSlot(slots, start, index("10:00"))).toEqual({
      ...start,
      blocked: true,
    })
  })
})

describe("helpers", () => {
  it("formats durations and detects overlaps", () => {
    expect(displayDuration(90)).toBe("1 jam 30 menit")
    expect(rangeIsBusy(date, "08:30", "09:30", busy)).toBe(true)
    expect(rangeIsBusy(date, "10:00", "11:00", busy)).toBe(false)
  })
})
