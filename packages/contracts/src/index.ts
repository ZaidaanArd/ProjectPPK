import { z } from "zod"

export const userRoleSchema = z.enum(["user", "officer", "admin"])
export const accountStatusSchema = z.enum([
  "pending",
  "active",
  "rejected",
  "disabled",
])
export const facilityStatusSchema = z.enum([
  "active",
  "maintenance",
  "inactive",
])
export const reservationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "cancelled",
])
export const reportStatusSchema = z.enum([
  "pending",
  "in_progress",
  "resolved",
  "rejected",
])

export type UserRole = z.infer<typeof userRoleSchema>
export type AccountStatus = z.infer<typeof accountStatusSchema>
export type FacilityStatus = z.infer<typeof facilityStatusSchema>
export type ReservationStatus = z.infer<typeof reservationStatusSchema>
export type ReportStatus = z.infer<typeof reportStatusSchema>

export const userSessionSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  role: userRoleSchema,
  status: accountStatusSchema,
})

export const sessionResponseSchema = z.object({
  user: userSessionSchema.nullable(),
})

export type UserSession = z.infer<typeof userSessionSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string(),
})

export type ApiError = z.infer<typeof apiErrorSchema>

export const loginInputSchema = z.object({
  email: z.email("Gunakan alamat email yang valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
})

export const registerInputSchema = loginInputSchema
  .extend({
    name: z.string().trim().min(3, "Nama minimal 3 karakter.").max(100),
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Konfirmasi kata sandi tidak sama.",
  })

export type LoginInput = z.infer<typeof loginInputSchema>
export type RegisterInput = z.infer<typeof registerInputSchema>

export const facilitySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.string(),
  location: z.string(),
  capacity: z.number().int().positive(),
  description: z.string(),
  status: facilityStatusSchema,
})

export type Facility = z.infer<typeof facilitySchema>

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const OPENING_MINUTE = 7 * 60
const CLOSING_MINUTE = 20 * 60

export type ReservationWindowIssue =
  | "invalid-order"
  | "different-day"
  | "outside-operating-hours"
  | "not-aligned-to-slot"

export function getReservationWindowIssue(
  startTime: string,
  endTime: string
): ReservationWindowIssue | null {
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "invalid-order"
  }

  if (start >= end) {
    return "invalid-order"
  }

  const jakartaStart = new Date(start.getTime() + JAKARTA_OFFSET_MS)
  const jakartaEnd = new Date(end.getTime() + JAKARTA_OFFSET_MS)
  const startDay = jakartaStart.toISOString().slice(0, 10)
  const endDay = jakartaEnd.toISOString().slice(0, 10)

  if (startDay !== endDay) {
    return "different-day"
  }

  const startMinute =
    jakartaStart.getUTCHours() * 60 + jakartaStart.getUTCMinutes()
  const endMinute = jakartaEnd.getUTCHours() * 60 + jakartaEnd.getUTCMinutes()

  if (startMinute < OPENING_MINUTE || endMinute > CLOSING_MINUTE) {
    return "outside-operating-hours"
  }

  if (startMinute % 30 !== 0 || endMinute % 30 !== 0) {
    return "not-aligned-to-slot"
  }

  return null
}

export const reservationInputSchema = z
  .object({
    facilityId: z.uuid(),
    purpose: z.string().trim().min(10).max(500),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
  })
  .superRefine((value, context) => {
    const issue = getReservationWindowIssue(value.startTime, value.endTime)
    const messages: Record<ReservationWindowIssue, string> = {
      "invalid-order": "Waktu selesai harus setelah waktu mulai.",
      "different-day": "Reservasi harus selesai pada hari yang sama.",
      "outside-operating-hours":
        "Reservasi harus berada dalam jam operasional 07.00–20.00 WIB.",
      "not-aligned-to-slot": "Waktu harus menggunakan kelipatan 30 menit.",
    }

    if (issue) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: messages[issue],
      })
    }
  })

export type ReservationInput = z.infer<typeof reservationInputSchema>

export const reportInputSchema = z.object({
  facilityId: z.uuid(),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(20).max(2_000),
})

export type ReportInput = z.infer<typeof reportInputSchema>
