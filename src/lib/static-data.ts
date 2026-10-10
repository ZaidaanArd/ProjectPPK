"use client"

import { useEffect, useSyncExternalStore } from "react"
import {
  assertMaintenanceSlotFree,
  assertNoMaintenanceOverlap,
  validateMaintenanceWindow,
} from "../../convex/lib/maintenance"
import {
  AUTO_REJECTION_NOTE,
  SLOT_MS,
  overlaps,
  validateReservationWindow,
} from "../../convex/lib/reservationTime"
import {
  assertFacilityCanApprove,
  assertReportTransition,
} from "../../convex/lib/workflows"
import { csvDocument } from "./csv"
import {
  changeDeadline,
  effectiveReservationStatus,
  EXPIRATION_NOTE,
  type ReservationStatus,
} from "../../convex/lib/reservationState"

type Role = "user" | "officer" | "admin"
type AccountStatus = "pending" | "active" | "rejected" | "disabled"
type FacilityStatus = "active" | "maintenance" | "inactive"
type ReportStatus = "pending" | "in_progress" | "resolved" | "rejected"

type Account = {
  id: string
  name: string
  email: string
  role: Role
  status: AccountStatus
  userKind?: "student" | "lecturer"
  institutionalId?: string
  mustChangePassword: boolean
  rejectionReason?: string
  createdAt: number
}
type Facility = {
  id: string
  name: string
  type: string
  location: string
  capacity: number
  description: string
  status: FacilityStatus
  createdAt: number
  updatedAt: number
}
type Reservation = {
  id: string
  userId: string
  facilityId: string
  purpose: string
  startAt: number
  endAt: number
  status: ReservationStatus
  decisionNote?: string
  createdAt: number
  updatedAt: number
}
type ScheduleChange = {
  id: string
  reservationId: string
  userId: string
  facilityId: string
  originalStartAt: number
  originalEndAt: number
  startAt: number
  endAt: number
  reason: string
  status: ReservationStatus
  decisionNote?: string
  createdAt: number
  updatedAt: number
}
type Report = {
  id: string
  reporterId: string
  facilityId: string
  category: string
  description: string
  photoStorageId?: string
  photoName?: string
  status: ReportStatus
  resolutionNote?: string
  createdAt: number
  updatedAt: number
}
type MaintenanceStatus = "scheduled" | "completed" | "cancelled"
type MaintenanceWindow = {
  id: string
  facilityId: string
  reportId?: string
  reason: string
  startAt: number
  endAt: number
  status: MaintenanceStatus
  createdBy: string
  closedAt?: number
  createdAt: number
  updatedAt: number
}
export type StaticData = {
  version: 1
  accounts: Account[]
  facilities: Facility[]
  reservations: Reservation[]
  reservationChanges?: ScheduleChange[]
  reports: Report[]
  // Missing in browser data saved before repairs were scheduled.
  maintenance?: MaintenanceWindow[]
}

const storageKey = "sthana:static-data:v1"
const roleCookie = "sthana_demo_role"
const listeners = new Set<() => void>()
const seedTime = Date.now()
const tomorrow = new Date(seedTime + 7 * 60 * 60 * 1000)
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
const date = tomorrow.toISOString().slice(0, 10)
const slot = (time: string) => Date.parse(`${date}T${time}:00+07:00`)
const todayDate = new Date(seedTime + 7 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10)
const todaySlot = (time: string) => Date.parse(`${todayDate}T${time}:00+07:00`)
const currentSlot = Math.floor(seedTime / SLOT_MS) * SLOT_MS

export const initialStaticData: StaticData = {
  version: 1,
  accounts: [
    {
      id: "demo-user",
      name: "Pengguna Demo",
      email: "pengguna@demo.local",
      role: "user",
      status: "active",
      mustChangePassword: false,
      createdAt: seedTime,
    },
    {
      id: "demo-officer",
      name: "Petugas Demo",
      email: "petugas@demo.local",
      role: "officer",
      status: "active",
      mustChangePassword: false,
      createdAt: seedTime,
    },
    {
      id: "demo-admin",
      name: "Admin Demo",
      email: "admin@demo.local",
      role: "admin",
      status: "active",
      mustChangePassword: false,
      createdAt: seedTime,
    },
    {
      id: "demo-pending",
      name: "Calon Pengguna",
      email: "calon@demo.local",
      role: "user",
      status: "pending",
      mustChangePassword: false,
      createdAt: seedTime,
    },
  ],
  facilities: [
    {
      id: "demo-aula",
      name: "Aula Gedung A",
      type: "Aula",
      location: "Gedung A · Lantai 2",
      capacity: 300,
      description:
        "Aula untuk seminar, wisuda, dan kegiatan organisasi mahasiswa.",
      status: "active",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
    {
      id: "demo-lab",
      name: "Lab Komputer 3",
      type: "Laboratorium",
      location: "Gedung Informatika · Lantai 3",
      capacity: 40,
      description: "Laboratorium komputer untuk praktikum dan pelatihan.",
      status: "active",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
    {
      id: "demo-seminar",
      name: "Ruang Seminar 2",
      type: "Ruang Kelas",
      location: "Gedung Kuliah Bersama · Lantai 1",
      capacity: 60,
      description: "Ruang presentasi untuk seminar, sidang, dan kuliah tamu.",
      status: "active",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
    {
      id: "demo-basket",
      name: "Lapangan Basket Outdoor",
      type: "Olahraga",
      location: "Kawasan Sport Center",
      capacity: 50,
      description:
        "Lapangan luar ruang untuk latihan dan kegiatan olahraga kampus.",
      status: "active",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
    {
      id: "demo-studio",
      name: "Studio Multimedia",
      type: "Laboratorium",
      location: "Gedung Desain · Lantai 2",
      capacity: 25,
      description: "Studio produksi audio visual dan kegiatan kreatif.",
      status: "active",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
    {
      id: "demo-rapat",
      name: "Ruang Rapat Senat",
      type: "Rapat",
      location: "Gedung Rektorat · Lantai 4",
      capacity: 20,
      description: "Ruang rapat untuk dosen dan senat.",
      status: "active",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
  ],
  reservations: [
    {
      id: "demo-reservation-approved",
      userId: "demo-user",
      facilityId: "demo-aula",
      purpose: "Seminar kampus",
      startAt: slot("09:00"),
      endAt: slot("10:00"),
      status: "approved",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
    {
      id: "demo-reservation-pending",
      userId: "demo-user",
      facilityId: "demo-lab",
      purpose: "Praktikum bersama",
      startAt: slot("13:00"),
      endAt: slot("14:00"),
      status: "pending",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
    {
      id: "demo-reservation-today",
      userId: "demo-user",
      facilityId: "demo-seminar",
      purpose: "Kuliah tamu",
      startAt: todaySlot("10:00"),
      endAt: todaySlot("11:00"),
      status: "approved",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
  ],
  reports: [
    {
      id: "demo-report",
      reporterId: "demo-user",
      facilityId: "demo-lab",
      category: "Perangkat",
      description: "Satu komputer tidak menyala.",
      status: "pending",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
  ],
  maintenance: [
    {
      id: "demo-maintenance-studio",
      facilityId: "demo-studio",
      reason: "Perawatan peralatan audio dan pencahayaan studio.",
      startAt: currentSlot,
      endAt: currentSlot + 2 * 24 * 60 * 60 * 1000,
      status: "scheduled",
      createdBy: "demo-officer",
      createdAt: seedTime,
      updatedAt: seedTime,
    },
  ],
}

let state: StaticData = initialStaticData
let hydrated = false
const photoUrls = new Map<string, string>()

function emit() {
  for (const listener of listeners) listener()
}
function replace(next: StaticData) {
  state = next
  try {
    localStorage.setItem(storageKey, JSON.stringify(next))
  } catch {
    /* memory remains usable */
  }
  emit()
}
export function getStaticData() {
  return state
}
export function subscribeStaticData(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function useStaticData() {
  useEffect(() => {
    void hydrateStaticData()
    const tick = () => {
      const now = Date.now()
      const reservations = state.reservations.map((r) =>
        r.status === "pending" && r.startAt <= now
          ? {
              ...r,
              status: "expired" as const,
              decisionNote: EXPIRATION_NOTE,
              updatedAt: now,
            }
          : r
      )
      const reservationChanges = (state.reservationChanges ?? []).map((r) =>
        r.status === "pending" && changeDeadline(r) <= now
          ? {
              ...r,
              status: "expired" as const,
              decisionNote: EXPIRATION_NOTE,
              updatedAt: now,
            }
          : r
      )
      if (
        reservations.some((r, i) => r !== state.reservations[i]) ||
        reservationChanges.some((r, i) => r !== state.reservationChanges?.[i])
      )
        replace({ ...state, reservations, reservationChanges })
    }
    const timer = window.setInterval(tick, 1000)
    window.addEventListener("focus", tick)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", tick)
    }
  }, [])
  return useSyncExternalStore(
    subscribeStaticData,
    getStaticData,
    () => initialStaticData
  )
}

function conflicts(first: Reservation, second: Reservation) {
  return (
    first.facilityId === second.facilityId &&
    overlaps(first.startAt, first.endAt, second.startAt, second.endAt)
  )
}

function rejectPendingConflicts(reservations: Reservation[]) {
  const approved = reservations.filter((item) => item.status === "approved")
  let changed = false
  const next = reservations.map((item) => {
    if (
      item.status === "pending" &&
      approved.some((winner) => conflicts(item, winner))
    ) {
      changed = true
      return {
        ...item,
        status: "rejected" as const,
        decisionNote: AUTO_REJECTION_NOTE,
      }
    }
    return item
  })
  return changed ? next : null
}

/** Windows whose end has passed count as completed, like the server's job. */
function windowStatus(window: MaintenanceWindow): MaintenanceStatus {
  return window.status === "scheduled" && window.endAt <= Date.now()
    ? "completed"
    : window.status
}
function maintenanceWindows() {
  return state.maintenance ?? []
}
function scheduledWindows(facilityId: string, startAt: number, endAt: number) {
  return maintenanceWindows().filter(
    (item) =>
      item.facilityId === facilityId &&
      windowStatus(item) === "scheduled" &&
      overlaps(item.startAt, item.endAt, startAt, endAt)
  )
}
function reservationsIn(
  facilityId: string,
  status: "pending" | "approved",
  startAt: number,
  endAt: number
) {
  return state.reservations.filter(
    (item) =>
      item.facilityId === facilityId &&
      item.status === status &&
      overlaps(item.startAt, item.endAt, startAt, endAt)
  )
}
function assertWindowFree(
  facilityId: string,
  range: { startAt: number; endAt: number },
  ignoreId?: string
) {
  assertMaintenanceSlotFree(range, {
    approved: reservationsIn(
      facilityId,
      "approved",
      range.startAt,
      range.endAt
    ),
    pending: reservationsIn(facilityId, "pending", range.startAt, range.endAt),
    maintenance: scheduledWindows(
      facilityId,
      range.startAt,
      range.endAt
    ).filter((item) => item.id !== ignoreId),
  })
}
/** Completes a started window now, or cancels one that has not started. */
function closeWindowNow(
  window: MaintenanceWindow,
  now: number
): MaintenanceWindow {
  const started = window.startAt <= now
  return {
    ...window,
    status: started ? "completed" : "cancelled",
    endAt: started ? Math.min(window.endAt, now) : window.endAt,
    closedAt: now,
    updatedAt: now,
  }
}
function setMaintenance(
  update: (items: MaintenanceWindow[]) => MaintenanceWindow[]
) {
  replace({ ...state, maintenance: update(maintenanceWindows()) })
}

export async function hydrateStaticData() {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (
        parsed &&
        typeof parsed === "object" &&
        "version" in parsed &&
        parsed.version === 1 &&
        "accounts" in parsed &&
        Array.isArray(parsed.accounts) &&
        "facilities" in parsed &&
        Array.isArray(parsed.facilities) &&
        "reservations" in parsed &&
        Array.isArray(parsed.reservations) &&
        "reports" in parsed &&
        Array.isArray(parsed.reports)
      )
        state = parsed as StaticData
    }
  } catch {
    /* use seed data */
  }
  const reconciled = rejectPendingConflicts(state.reservations)
  if (reconciled) replace({ ...state, reservations: reconciled })
  else emit()
  await loadPhotos()
}

export function getDemoRole(): Role | null {
  if (typeof document === "undefined") return null
  const value = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${roleCookie}=`))
    ?.split("=")[1]
  return value === "user" || value === "officer" || value === "admin"
    ? value
    : null
}
export function setDemoRole(role: Role | null) {
  document.cookie = `${roleCookie}=${role ?? ""}; Path=/; SameSite=Lax${role ? "" : "; Max-Age=0"}`
  emit()
}
export function getDemoAccount(role: Role) {
  return state.accounts.find((account) => account.id === `demo-${role}`)!
}

function photoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sthana-static-photos", 1)
    request.onupgradeneeded = () => request.result.createObjectStore("photos")
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function loadPhotos() {
  if (typeof indexedDB === "undefined") return
  try {
    const db = await photoDb()
    for (const report of state.reports) {
      if (!report.photoStorageId) continue
      const blob = await new Promise<Blob | undefined>((resolve) => {
        const request = db
          .transaction("photos", "readonly")
          .objectStore("photos")
          .get(report.photoStorageId!)
        request.onsuccess = () => resolve(request.result as Blob | undefined)
        request.onerror = () => resolve(undefined)
      })
      if (blob) photoUrls.set(report.photoStorageId, URL.createObjectURL(blob))
    }
    db.close()
    state = { ...state }
    emit()
  } catch {
    /* reports remain readable without images */
  }
}
export async function saveStaticPhoto(file: File) {
  if (
    file.size > 5 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  ) {
    throw new Error("Foto harus JPG, PNG, atau WebP dan maksimal 5 MB")
  }
  const id = `demo-photo-${crypto.randomUUID()}`
  const db = await photoDb()
  await new Promise<void>((resolve, reject) => {
    const request = db
      .transaction("photos", "readwrite")
      .objectStore("photos")
      .put(file, id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
  db.close()
  photoUrls.set(id, URL.createObjectURL(file))
  return id
}
export async function resetStaticData() {
  for (const url of photoUrls.values()) URL.revokeObjectURL(url)
  photoUrls.clear()
  try {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase("sthana-static-photos")
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
      request.onblocked = () => resolve()
    })
  } catch {
    /* ignore */
  }
  replace(structuredClone(initialStaticData))
}

function field(args: unknown, key: string): unknown {
  return (args as Record<string, unknown> | undefined)?.[key]
}
function value(args: unknown, key: string): string {
  return String(field(args, key) ?? "")
}
function account() {
  return getDemoAccount(getDemoRole() ?? "user")
}
function facilityName(id: string) {
  return (
    state.facilities.find((facility) => facility.id === id)?.name ??
    "Fasilitas dihapus"
  )
}
function reportItem(report: Report) {
  return {
    ...report,
    facilityName: facilityName(report.facilityId),
    photoUrl: report.photoStorageId
      ? (photoUrls.get(report.photoStorageId) ?? null)
      : null,
  }
}

export function staticQuery(name: string, args: unknown): unknown {
  switch (name) {
    case "profiles:current":
      return { ...account(), status: "active" }
    case "facilities:listPublic":
      return state.facilities
        .filter((f) => f.status !== "inactive")
        .map(
          ({
            id,
            name,
            type,
            location,
            capacity,
            description,
            status,
            createdAt,
          }) => {
            const next = maintenanceWindows()
              .filter(
                (item) =>
                  item.facilityId === id && windowStatus(item) === "scheduled"
              )
              .sort((a, b) => a.startAt - b.startAt)[0]
            return {
              id,
              name,
              type,
              location,
              capacity,
              description,
              status,
              nextMaintenance: next
                ? { startAt: next.startAt, endAt: next.endAt }
                : null,
              createdAt,
            }
          }
        )
    case "facilities:getPublicAvailability": {
      const id = value(args, "facilityId")
      const start = Number(field(args, "rangeStart"))
      const end = Number(field(args, "rangeEnd"))
      return {
        facilityStatus:
          state.facilities.find((f) => f.id === id)?.status ?? "inactive",
        reservations: state.reservations
          .filter(
            (r) =>
              r.facilityId === id &&
              r.status === "approved" &&
              r.startAt < end &&
              r.endAt > start
          )
          .map(({ startAt, endAt, status }) => ({ startAt, endAt, status })),
        pending: [
          ...state.reservations,
          ...(state.reservationChanges ?? []).filter(
            (r) => changeDeadline(r) > Date.now()
          ),
        ]
          .filter(
            (r) =>
              r.facilityId === id &&
              r.status === "pending" &&
              r.startAt > Date.now() &&
              r.startAt < end &&
              r.endAt > start
          )
          .map(({ startAt, endAt }) => ({ startAt, endAt })),
        maintenance: scheduledWindows(id, start, end).map(
          ({ startAt, endAt }) => ({ startAt, endAt })
        ),
      }
    }
    case "facilities:listManaged":
      return state.facilities
    case "reservations:listMine":
      return state.reservations
        .filter((r) => r.userId === account().id)
        .map((r) => ({
          ...r,
          status: effectiveReservationStatus(r, Date.now()),
          facilityName: facilityName(r.facilityId),
          facilityLocation:
            state.facilities.find((f) => f.id === r.facilityId)?.location ??
            "-",
        }))
        .reverse()
    case "reservations:listQueue":
      return state.reservations
        .map((r) => ({
          ...r,
          status: effectiveReservationStatus(r, Date.now()),
          applicantName:
            state.accounts.find((a) => a.id === r.userId)?.name ??
            "Pengguna dihapus",
          applicantEmail:
            state.accounts.find((a) => a.id === r.userId)?.email ?? "-",
          facilityName: facilityName(r.facilityId),
        }))
        .reverse()
    case "reservations:listScheduleChanges":
      return (state.reservationChanges ?? [])
        .filter((r) => account().role !== "user" || r.userId === account().id)
        .map((r) => ({
          ...r,
          status:
            r.status === "pending" && changeDeadline(r) <= Date.now()
              ? "expired"
              : r.status,
          facilityName: facilityName(r.facilityId),
          applicantName:
            state.accounts.find((a) => a.id === r.userId)?.name ??
            "Pengguna dihapus",
        }))
        .reverse()
    case "reports:listMine":
      return state.reports
        .filter((r) => r.reporterId === account().id)
        .map(reportItem)
        .reverse()
    case "reports:listQueue":
      return state.reports
        .map((r) => ({
          ...reportItem(r),
          reporterName:
            state.accounts.find((a) => a.id === r.reporterId)?.name ??
            "Pengguna dihapus",
          reporterEmail:
            state.accounts.find((a) => a.id === r.reporterId)?.email ?? "-",
          maintenance: maintenanceWindows()
            .filter((item) => item.reportId === r.id)
            .reverse()
            .map((item) => ({
              id: item.id,
              startAt: item.startAt,
              endAt: item.endAt,
              status: windowStatus(item),
            })),
        }))
        .reverse()
    case "maintenance:listManaged":
      return maintenanceWindows()
        .map((item) => ({
          ...item,
          status: windowStatus(item),
          facilityName: facilityName(item.facilityId),
          reportCategory: state.reports.find((r) => r.id === item.reportId)
            ?.category,
          createdByName:
            state.accounts.find((a) => a.id === item.createdBy)?.name ??
            "Petugas",
        }))
        .reverse()
    case "maintenance:agenda": {
      const id = value(args, "facilityId")
      const start = Number(field(args, "rangeStart"))
      const end = Number(field(args, "rangeEnd"))
      return {
        reservations: [
          ...reservationsIn(id, "approved", start, end),
          ...reservationsIn(id, "pending", start, end),
        ].map(({ startAt, endAt, status }) => ({ startAt, endAt, status })),
        maintenance: scheduledWindows(id, start, end).map((item) => ({
          id: item.id,
          startAt: item.startAt,
          endAt: item.endAt,
        })),
      }
    }
    case "admin:listAccounts":
      return state.accounts
        .filter(
          (a) => !field(args, "status") || a.status === field(args, "status")
        )
        .reverse()
    case "admin:analytics":
      return {
        accounts: state.accounts.length,
        pendingAccounts: state.accounts.filter(
          (account) => account.status === "pending"
        ).length,
        facilities: state.facilities.length,
        reservations: state.reservations.length,
        reports: state.reports.length,
        reservationsByStatus: (
          ["pending", "approved", "rejected", "cancelled"] as const
        ).map((status) => ({
          status,
          count: state.reservations.filter((r) => r.status === status).length,
        })),
        reportsByStatus: (
          ["pending", "in_progress", "resolved", "rejected"] as const
        ).map((status) => ({
          status,
          count: state.reports.filter((r) => r.status === status).length,
        })),
        facilityUsage: state.facilities.map((f) => {
          const approved = state.reservations.filter(
            (r) => r.facilityId === f.id && r.status === "approved"
          )
          return {
            facilityId: f.id,
            name: f.name,
            location: f.location,
            approvedReservations: approved.length,
            reservedMinutes: approved.reduce(
              (sum, r) => sum + (r.endAt - r.startAt) / 60000,
              0
            ),
            reports: state.reports.filter((r) => r.facilityId === f.id).length,
          }
        }),
      }
    default:
      throw new Error(`Static query not implemented: ${name}`)
  }
}

function change<T>(
  key:
    | "facilities"
    | "reservations"
    | "reports"
    | "accounts"
    | "reservationChanges",
  update: (items: T[]) => T[]
) {
  replace({ ...state, [key]: update((state[key] ?? []) as T[]) })
}
function required<T>(items: T[], id: string): T {
  const found = items.find((item) => (item as { id: string }).id === id)
  if (!found) throw new Error("Data demo tidak ditemukan")
  return found
}
function requireText(text: string) {
  if (!text.trim()) throw new Error("Kolom wajib diisi")
}
function requireRole(roles: Role[]) {
  if (!getDemoRole() || !roles.includes(getDemoRole()!))
    throw new Error("Peran demo tidak diizinkan")
}

export async function staticMutation(
  name: string,
  args: unknown
): Promise<unknown> {
  await hydrateStaticData()
  const now = Date.now()
  switch (name) {
    case "reservations:create": {
      requireRole(["user"])
      const facilityId = value(args, "facilityId")
      const facility = required(state.facilities, facilityId)
      if (facility.status !== "active")
        throw new Error("Fasilitas tidak tersedia")
      const startAt = Number(field(args, "startAt")),
        endAt = Number(field(args, "endAt"))
      validateReservationWindow(startAt, endAt)
      if (startAt <= now)
        throw new Error("Waktu reservasi harus berada di masa mendatang")
      requireText(value(args, "purpose"))
      const duplicate = state.reservations.find(
        (r) =>
          r.userId === account().id &&
          r.facilityId === facilityId &&
          r.startAt === startAt &&
          r.endAt === endAt &&
          ["pending", "approved"].includes(r.status)
      )
      if (duplicate) return duplicate.id
      if (
        state.reservations.some(
          (item) =>
            item.facilityId === facilityId &&
            item.status === "approved" &&
            overlaps(item.startAt, item.endAt, startAt, endAt)
        )
      )
        throw new Error("Slot sudah digunakan oleh reservasi lain")
      assertNoMaintenanceOverlap(
        { startAt, endAt },
        scheduledWindows(facilityId, startAt, endAt)
      )
      const id = `demo-reservation-${crypto.randomUUID()}`
      change<Reservation>("reservations", (items) => [
        ...items,
        {
          id,
          userId: account().id,
          facilityId,
          purpose: value(args, "purpose").trim(),
          startAt,
          endAt,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        },
      ])
      return id
    }
    case "reservations:requestScheduleChange": {
      requireRole(["user"])
      const original = required(
        state.reservations,
        value(args, "reservationId")
      )
      if (
        original.userId !== account().id ||
        original.status !== "approved" ||
        original.startAt <= now
      )
        throw new Error(
          "Hanya reservasi disetujui yang belum dimulai dapat diubah"
        )
      const startAt = Number(field(args, "startAt")),
        endAt = Number(field(args, "endAt")),
        reason = value(args, "reason").trim()
      validateReservationWindow(startAt, endAt)
      if (startAt <= now) throw new Error("Jadwal baru harus di masa mendatang")
      if (startAt === original.startAt && endAt === original.endAt)
        throw new Error("Pilih jadwal yang berbeda")
      requireText(reason)
      if (
        (state.reservationChanges ?? []).some(
          (r) =>
            r.reservationId === original.id &&
            r.status === "pending" &&
            changeDeadline(r) > now
        )
      )
        throw new Error("Masih ada perubahan jadwal menunggu")
      assertFacilityCanApprove(
        required(state.facilities, original.facilityId).status
      )
      assertNoMaintenanceOverlap(
        { startAt, endAt },
        scheduledWindows(original.facilityId, startAt, endAt)
      )
      if (
        state.reservations.some(
          (r) =>
            r.id !== original.id &&
            r.facilityId === original.facilityId &&
            r.status === "approved" &&
            overlaps(r.startAt, r.endAt, startAt, endAt)
        )
      )
        throw new Error("Slot sudah digunakan oleh reservasi lain")
      const id = `demo-change-${crypto.randomUUID()}`
      change<ScheduleChange>("reservationChanges", (items) => [
        ...items,
        {
          id,
          reservationId: original.id,
          userId: account().id,
          facilityId: original.facilityId,
          originalStartAt: original.startAt,
          originalEndAt: original.endAt,
          startAt,
          endAt,
          reason,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        },
      ])
      return id
    }
    case "reservations:cancelScheduleChange": {
      requireRole(["user"])
      const item = required(
        state.reservationChanges ?? [],
        value(args, "changeId")
      )
      if (item.userId !== account().id)
        throw new Error("Perubahan jadwal tidak ditemukan")
      if (item.status === "cancelled") return null
      if (item.status !== "pending" || changeDeadline(item) <= now)
        throw new Error("Perubahan jadwal sudah diproses atau kedaluwarsa")
      change<ScheduleChange>("reservationChanges", (items) =>
        items.map((r) =>
          r.id === item.id ? { ...r, status: "cancelled", updatedAt: now } : r
        )
      )
      return null
    }
    case "reservations:decideScheduleChange": {
      requireRole(["officer", "admin"])
      const item = required(
        state.reservationChanges ?? [],
        value(args, "changeId")
      )
      const original = required(state.reservations, item.reservationId)
      const decision = value(args, "decision")
      if (!["approved", "rejected"].includes(decision))
        throw new Error("Keputusan tidak valid")
      if (item.status !== "pending" || changeDeadline(item) <= now)
        throw new Error("Perubahan jadwal sudah diproses atau kedaluwarsa")
      if (
        original.status !== "approved" ||
        original.startAt !== item.originalStartAt ||
        original.endAt !== item.originalEndAt
      )
        throw new Error("Reservasi asal telah berubah. Muat ulang antrean.")
      if (decision === "rejected") requireText(value(args, "note"))
      if (decision === "approved") {
        assertFacilityCanApprove(
          required(state.facilities, item.facilityId).status
        )
        assertNoMaintenanceOverlap(
          item,
          scheduledWindows(item.facilityId, item.startAt, item.endAt)
        )
        if (
          state.reservations.some(
            (r) =>
              r.id !== original.id &&
              r.facilityId === item.facilityId &&
              r.status === "approved" &&
              overlaps(r.startAt, r.endAt, item.startAt, item.endAt)
          )
        )
          throw new Error(
            "Jadwal baru sudah terisi. Jadwal lama tetap berlaku."
          )
      }
      const reservations =
        decision === "approved"
          ? state.reservations.map((r) =>
              r.id === original.id
                ? {
                    ...r,
                    startAt: item.startAt,
                    endAt: item.endAt,
                    updatedAt: now,
                  }
                : r.status === "pending" &&
                    r.facilityId === item.facilityId &&
                    overlaps(r.startAt, r.endAt, item.startAt, item.endAt)
                  ? {
                      ...r,
                      status: "rejected" as const,
                      decisionNote: AUTO_REJECTION_NOTE,
                      updatedAt: now,
                    }
                  : r
            )
          : state.reservations
      replace({
        ...state,
        reservations,
        reservationChanges: (state.reservationChanges ?? []).map((r) =>
          r.id === item.id
            ? {
                ...r,
                status: decision as "approved" | "rejected",
                decisionNote: value(args, "note").trim() || undefined,
                updatedAt: now,
              }
            : r
        ),
      })
      return null
    }
    case "reservations:cancelMine": {
      requireRole(["user"])
      const id = value(args, "reservationId"),
        item = required(state.reservations, id)
      if (
        item.userId !== account().id ||
        !["pending", "approved"].includes(item.status)
      )
        throw new Error("Reservasi tidak dapat dibatalkan")
      if (item.startAt - now < 3600000)
        throw new Error(
          "Reservasi hanya dapat dibatalkan minimal 1 jam sebelumnya"
        )
      change<Reservation>("reservations", (items) =>
        items.map((r) =>
          r.id === id ? { ...r, status: "cancelled", updatedAt: now } : r
        )
      )
      return null
    }
    case "reservations:decide": {
      requireRole(["officer", "admin"])
      const id = value(args, "reservationId"),
        item = required(state.reservations, id),
        decision = value(args, "decision") as "approved" | "rejected"
      if (item.status !== "pending") throw new Error("Reservasi sudah diproses")
      if (item.startAt <= now) throw new Error(EXPIRATION_NOTE)
      if (decision === "approved") {
        assertFacilityCanApprove(
          required(state.facilities, item.facilityId).status
        )
        assertNoMaintenanceOverlap(
          item,
          scheduledWindows(item.facilityId, item.startAt, item.endAt)
        )
      }
      const alreadyBooked =
        decision === "approved" &&
        state.reservations.some(
          (r) => r.status === "approved" && conflicts(r, item)
        )
      change<Reservation>("reservations", (items) =>
        items.map((r) =>
          r.id === id
            ? {
                ...r,
                status: alreadyBooked ? "rejected" : decision,
                decisionNote: alreadyBooked
                  ? AUTO_REJECTION_NOTE
                  : value(args, "note").trim() || undefined,
                updatedAt: now,
              }
            : decision === "approved" &&
                !alreadyBooked &&
                r.status === "pending" &&
                conflicts(r, item)
              ? {
                  ...r,
                  status: "rejected",
                  decisionNote: AUTO_REJECTION_NOTE,
                  updatedAt: now,
                }
              : r
        )
      )
      return null
    }
    case "reservations:cancelByStaff": {
      requireRole(["officer", "admin"])
      const id = value(args, "reservationId"),
        item = required(state.reservations, id)
      if (item.status !== "pending" && item.status !== "approved")
        throw new Error("Reservasi tidak dapat dibatalkan")
      requireText(value(args, "reason"))
      change<Reservation>("reservations", (items) =>
        items.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "cancelled",
                decisionNote: value(args, "reason"),
                updatedAt: now,
              }
            : r
        )
      )
      return null
    }
    case "reports:create": {
      requireRole(["user"])
      const facilityId = value(args, "facilityId")
      required(state.facilities, facilityId)
      requireText(value(args, "category"))
      requireText(value(args, "description"))
      const id = `demo-report-${crypto.randomUUID()}`
      change<Report>("reports", (items) => [
        ...items,
        {
          id,
          reporterId: account().id,
          facilityId,
          category: value(args, "category").trim(),
          description: value(args, "description").trim(),
          photoStorageId: value(args, "photoStorageId") || undefined,
          photoName: value(args, "photoName") || undefined,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        },
      ])
      return id
    }
    case "reports:updateStatus": {
      requireRole(["officer", "admin"])
      const id = value(args, "reportId"),
        item = required(state.reports, id)
      const status = value(args, "status") as ReportStatus
      assertReportTransition(item.status, status)
      const note = value(args, "note").trim()
      if (status !== "in_progress" && !note)
        throw new Error(
          "Catatan wajib diisi untuk menyelesaikan atau menolak laporan"
        )
      change<Report>("reports", (items) =>
        items.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                resolutionNote: note || r.resolutionNote,
                updatedAt: now,
              }
            : r
        )
      )
      // Closing a report ends its repairs, like the server.
      if (status === "resolved" || status === "rejected")
        setMaintenance((items) =>
          items.map((w) =>
            w.reportId === id && windowStatus(w) === "scheduled"
              ? closeWindowNow(w, now)
              : w
          )
        )
      // Legacy: only reopening a facility left in "maintenance" is honoured.
      if (field(args, "facilityMaintenance") === false)
        change<Facility>("facilities", (items) =>
          items.map((f) =>
            f.id === item.facilityId && f.status === "maintenance"
              ? { ...f, status: "active", updatedAt: now }
              : f
          )
        )
      return null
    }
    case "maintenance:schedule": {
      requireRole(["officer", "admin"])
      const facilityId = value(args, "facilityId")
      const facility = required(state.facilities, facilityId)
      if (facility.status === "inactive")
        throw new Error("Fasilitas tidak ditemukan atau nonaktif")
      const reason = value(args, "reason").trim()
      if (!reason) throw new Error("Alasan perbaikan wajib diisi")
      const reportId = value(args, "reportId") || undefined
      if (reportId) {
        const report = required(state.reports, reportId)
        if (report.facilityId !== facilityId)
          throw new Error("Laporan tidak cocok dengan fasilitas ini")
        if (report.status === "resolved" || report.status === "rejected")
          throw new Error("Laporan ini sudah ditutup")
      }
      const startAt = Number(field(args, "startAt")),
        endAt = Number(field(args, "endAt"))
      validateMaintenanceWindow(startAt, endAt, now)
      assertWindowFree(facilityId, { startAt, endAt })
      const id = `demo-maintenance-${crypto.randomUUID()}`
      setMaintenance((items) => [
        ...items,
        {
          id,
          facilityId,
          reportId,
          reason,
          startAt,
          endAt,
          status: "scheduled",
          createdBy: account().id,
          createdAt: now,
          updatedAt: now,
        },
      ])
      return id
    }
    case "maintenance:extend": {
      requireRole(["officer", "admin"])
      const window = required(maintenanceWindows(), value(args, "windowId"))
      if (windowStatus(window) !== "scheduled")
        throw new Error("Jadwal perbaikan tidak aktif")
      const endAt = Number(field(args, "endAt"))
      if (endAt <= window.endAt)
        throw new Error(
          "Waktu selesai baru harus setelah waktu selesai sekarang. Gunakan Selesai untuk mengakhiri lebih cepat."
        )
      validateMaintenanceWindow(window.startAt, endAt, now)
      assertWindowFree(
        window.facilityId,
        { startAt: window.endAt, endAt },
        window.id
      )
      setMaintenance((items) =>
        items.map((w) =>
          w.id === window.id ? { ...w, endAt, updatedAt: now } : w
        )
      )
      return null
    }
    case "maintenance:close": {
      requireRole(["officer", "admin"])
      const window = required(maintenanceWindows(), value(args, "windowId"))
      if (windowStatus(window) !== "scheduled")
        throw new Error("Jadwal perbaikan tidak aktif")
      const closed = closeWindowNow(window, now)
      setMaintenance((items) =>
        items.map((w) => (w.id === window.id ? closed : w))
      )
      return closed.status
    }
    case "facilities:create": {
      requireRole(["admin"])
      requireText(value(args, "name"))
      requireText(value(args, "type"))
      requireText(value(args, "location"))
      requireText(value(args, "description"))
      const id = `demo-facility-${crypto.randomUUID()}`
      change<Facility>("facilities", (items) => [
        ...items,
        {
          id,
          name: value(args, "name"),
          type: value(args, "type"),
          location: value(args, "location"),
          capacity: Number(field(args, "capacity")),
          description: value(args, "description"),
          status: "active",
          createdAt: now,
          updatedAt: now,
        },
      ])
      return id
    }
    case "facilities:update": {
      requireRole(["admin"])
      const id = value(args, "facilityId")
      required(state.facilities, id)
      change<Facility>("facilities", (items) =>
        items.map((f) =>
          f.id === id
            ? {
                ...f,
                name: value(args, "name"),
                type: value(args, "type"),
                location: value(args, "location"),
                capacity: Number(field(args, "capacity")),
                description: value(args, "description"),
                updatedAt: now,
              }
            : f
        )
      )
      return null
    }
    case "facilities:setStatus": {
      requireRole(["admin"])
      const id = value(args, "facilityId")
      required(state.facilities, id)
      if (value(args, "status") === "maintenance")
        throw new Error(
          "Gunakan Jadwal perbaikan untuk menutup fasilitas selama perbaikan"
        )
      change<Facility>("facilities", (items) =>
        items.map((f) =>
          f.id === id
            ? {
                ...f,
                status: value(args, "status") as FacilityStatus,
                updatedAt: now,
              }
            : f
        )
      )
      return null
    }
    case "facilities:remove": {
      requireRole(["admin"])
      const id = value(args, "facilityId")
      required(state.facilities, id)
      const hasActiveActivity =
        state.reservations.some(
          (r) =>
            r.facilityId === id &&
            (r.status === "pending" || r.status === "approved")
        ) ||
        state.reports.some(
          (r) =>
            r.facilityId === id &&
            (r.status === "pending" || r.status === "in_progress")
        )
      if (hasActiveActivity) {
        throw new Error(
          "Fasilitas masih memiliki reservasi aktif atau laporan yang belum selesai. Selesaikan data tersebut atau gunakan Sembunyikan."
        )
      }
      change<Facility>("facilities", (items) =>
        items.filter((f) => f.id !== id)
      )
      return null
    }
    case "admin:createAccount": {
      requireRole(["admin"])
      const email = value(args, "email").trim().toLowerCase()
      if (state.accounts.some((a) => a.email === email))
        throw new Error("Email sudah terdaftar")
      requireText(value(args, "name"))
      requireText(email)
      const id = `demo-account-${crypto.randomUUID()}`
      change<Account>("accounts", (items) => [
        ...items,
        {
          id,
          name: value(args, "name"),
          email,
          role: value(args, "role") as Role,
          status: "active",
          mustChangePassword: false,
          createdAt: now,
        },
      ])
      return id
    }
    case "admin:reviewAccount":
    case "admin:setAccountStatus": {
      requireRole(["admin"])
      const id = value(args, "profileId")
      required(state.accounts, id)
      const status =
        name === "admin:reviewAccount"
          ? value(args, "decision")
          : value(args, "status")
      change<Account>("accounts", (items) =>
        items.map((a) =>
          a.id === id
            ? {
                ...a,
                status: status as AccountStatus,
                rejectionReason: value(args, "reason") || undefined,
              }
            : a
        )
      )
      return null
    }
    case "profiles:changePassword":
      return null
    default:
      throw new Error(`Static mutation not implemented: ${name}`)
  }
}

export function createStaticRegistration(input: {
  name: string
  email: string
}) {
  const email = input.email.trim().toLowerCase()
  if (state.accounts.some((a) => a.email === email))
    throw new Error("Email sudah terdaftar")
  change<Account>("accounts", (items) => [
    ...items,
    {
      id: `demo-account-${crypto.randomUUID()}`,
      name: input.name.trim(),
      email,
      role: "user",
      status: "pending",
      mustChangePassword: false,
      createdAt: Date.now(),
    },
  ])
}

export function staticCsv(kind: "reservations" | "reports" | "summary") {
  if (kind === "summary") {
    return csvDocument(
      [
        "Fasilitas",
        "Lokasi",
        "Reservasi disetujui",
        "Menit pemakaian",
        "Laporan",
      ],
      state.facilities.map((facility) => {
        const approved = state.reservations.filter(
          (item) =>
            item.facilityId === facility.id && item.status === "approved"
        )
        return [
          facility.name,
          facility.location,
          approved.length,
          approved.reduce(
            (total, item) => total + (item.endAt - item.startAt) / 60000,
            0
          ),
          state.reports.filter((item) => item.facilityId === facility.id)
            .length,
        ]
      })
    )
  }
  const headers =
    kind === "reservations"
      ? [
          "ID",
          "Fasilitas",
          "Pemohon",
          "Email",
          "Tujuan",
          "Mulai",
          "Selesai",
          "Status",
        ]
      : [
          "ID",
          "Fasilitas",
          "Pelapor",
          "Email",
          "Kategori",
          "Deskripsi",
          "Status",
          "Catatan",
        ]
  const rows =
    kind === "reservations"
      ? state.reservations.map((r) => [
          r.id,
          facilityName(r.facilityId),
          state.accounts.find((a) => a.id === r.userId)?.name ?? "-",
          state.accounts.find((a) => a.id === r.userId)?.email ?? "-",
          r.purpose,
          r.startAt,
          r.endAt,
          r.status,
        ])
      : state.reports.map((r) => [
          r.id,
          facilityName(r.facilityId),
          state.accounts.find((a) => a.id === r.reporterId)?.name ?? "-",
          state.accounts.find((a) => a.id === r.reporterId)?.email ?? "-",
          r.category,
          r.description,
          r.status,
          r.resolutionNote ?? "",
        ])
  return csvDocument(headers, rows)
}
export function downloadStaticCsv(
  kind: "reservations" | "reports" | "summary"
) {
  const csv = staticCsv(kind)
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  )
  const link = document.createElement("a")
  link.href = url
  link.download = `sthana-demo-${kind}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
