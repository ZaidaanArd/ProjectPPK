/** Shared policy; server time is authoritative. No browser/framework imports. */
export const RESERVATION_LEAD_MS = 48 * 60 * 60 * 1000
export const RESERVATION_LEAD_MESSAGE =
  "Ajukan reservasi minimal 48 jam sebelum waktu mulai."

export function meetsReservationLeadTime(startAt: number, now: number) {
  return Number.isFinite(startAt) && startAt - now >= RESERVATION_LEAD_MS
}
