/** Shared by Convex, demo data and UI. All times are absolute timestamps. */
export type ReservationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"

export const EXPIRATION_NOTE =
  "Pengajuan kedaluwarsa karena waktu mulai sudah lewat."

export function effectiveReservationStatus<T extends string>(
  item: { status: T; startAt: number },
  now: number
): T | "expired" {
  return item.status === "pending" && item.startAt <= now
    ? "expired"
    : item.status
}

export function reservationDisplayStatus(
  item: { status: string; startAt: number; endAt: number },
  now: number
) {
  const status = effectiveReservationStatus(item, now)
  return status === "approved" && item.endAt <= now ? "completed" : status
}

export function jakartaDate(now: number) {
  return new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function changeDeadline(item: {
  originalStartAt: number
  startAt: number
}) {
  return Math.min(item.originalStartAt, item.startAt)
}
