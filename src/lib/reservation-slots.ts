/** Half-hour boundaries from 07.00 to 20.00 WIB (27 values, 26 slots). */
export const reservationTimes = Array.from({ length: 27 }, (_, index) => {
  const hour = 7 + Math.floor(index / 2)
  return `${String(hour).padStart(2, "0")}:${index % 2 ? "30" : "00"}`
})

export function toTimestamp(date: string, time: string) {
  return Date.parse(`${date}T${time}:00+07:00`)
}

export function displayTime(time: string) {
  return time.replace(":", ".")
}

export function displayDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return [hours && `${hours} jam`, remaining && `${remaining} menit`]
    .filter(Boolean)
    .join(" ")
}

export type BusyRange = { startAt: number; endAt: number }

export function rangeIsBusy(
  date: string,
  start: string,
  end: string,
  busy: readonly BusyRange[]
) {
  if (!start || !end) return false
  const startAt = toTimestamp(date, start)
  const endAt = toTimestamp(date, end)
  return busy.some((item) => item.startAt < endAt && startAt < item.endAt)
}

export type Slot = { start: string; end: string; taken: boolean }

/** The 26 half-hour slots of a day, marked taken when they overlap `busy`. */
export function daySlots(date: string, busy: readonly BusyRange[]): Slot[] {
  return reservationTimes.slice(0, -1).map((start, index) => {
    const end = reservationTimes[index + 1] ?? start
    return { start, end, taken: rangeIsBusy(date, start, end, busy) }
  })
}

/**
 * Applies a click on slot `index` to the current selection. The first click
 * (or a click before the current start) starts a new range; a later click
 * extends it through that slot unless a taken slot lies in between.
 */
export function selectSlot(
  slots: readonly Slot[],
  current: { start: string; end: string },
  index: number
): { start: string; end: string; blocked: boolean } {
  const slot = slots[index]
  if (!slot || slot.taken) return { ...current, blocked: true }
  const startIndex = slots.findIndex((item) => item.start === current.start)
  const endIndex = slots.findIndex((item) => item.end === current.end)
  const hasRange = startIndex >= 0 && endIndex >= startIndex
  const singleSlot = hasRange && startIndex === endIndex
  if (!singleSlot || index <= startIndex) {
    return { start: slot.start, end: slot.end, blocked: false }
  }
  const between = slots.slice(startIndex, index + 1)
  if (between.some((item) => item.taken)) {
    return { ...current, blocked: true }
  }
  return { start: current.start, end: slot.end, blocked: false }
}
