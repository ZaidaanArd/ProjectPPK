import { ConvexError } from "convex/values"

const JAKARTA_UTC_OFFSET_MS = 7 * 60 * 60 * 1000
const SLOT_MS = 30 * 60 * 1000
const OPEN_MINUTE = 7 * 60
const CLOSE_MINUTE = 20 * 60

function jakartaParts(timestamp: number) {
  const date = new Date(timestamp + JAKARTA_UTC_OFFSET_MS)

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    minuteOfDay: date.getUTCHours() * 60 + date.getUTCMinutes(),
    seconds: date.getUTCSeconds(),
    milliseconds: date.getUTCMilliseconds(),
  }
}

export function validateReservationWindow(startAt: number, endAt: number) {
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) {
    throw new ConvexError("Waktu reservasi tidak valid")
  }

  if (endAt <= startAt) {
    throw new ConvexError("Waktu selesai harus setelah waktu mulai")
  }

  const start = jakartaParts(startAt)
  const end = jakartaParts(endAt)
  const sameDay =
    start.year === end.year &&
    start.month === end.month &&
    start.day === end.day

  if (!sameDay) {
    throw new ConvexError("Reservasi harus selesai pada hari yang sama")
  }

  if (start.minuteOfDay < OPEN_MINUTE || end.minuteOfDay > CLOSE_MINUTE) {
    throw new ConvexError("Reservasi hanya tersedia pukul 07.00–20.00 WIB")
  }

  if (
    startAt % SLOT_MS !== 0 ||
    endAt % SLOT_MS !== 0 ||
    start.seconds !== 0 ||
    end.seconds !== 0 ||
    start.milliseconds !== 0 ||
    end.milliseconds !== 0
  ) {
    throw new ConvexError("Waktu reservasi harus mengikuti slot 30 menit")
  }
}

export function overlaps(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number
) {
  return firstStart < secondEnd && secondStart < firstEnd
}
