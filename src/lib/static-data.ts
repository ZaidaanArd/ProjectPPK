"use client"

import { useEffect, useSyncExternalStore } from "react"
import {
  AUTO_REJECTION_NOTE,
  overlaps,
  validateReservationWindow,
} from "../../convex/lib/reservationTime"
import {
  assertFacilityCanApprove,
  assertReportTransition,
} from "../../convex/lib/workflows"

type Role = "user" | "officer" | "admin"
type AccountStatus = "pending" | "active" | "rejected" | "disabled"
type FacilityStatus = "active" | "maintenance" | "inactive"
type ReservationStatus = "pending" | "approved" | "rejected" | "cancelled"
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
export type StaticData = {
  version: 1
  accounts: Account[]
  facilities: Facility[]
  reservations: Reservation[]
  reports: Report[]
}

const storageKey = "sthana:static-data:v1"
const roleCookie = "sthana_demo_role"
const listeners = new Set<() => void>()
const seedTime = Date.now()
const tomorrow = new Date(seedTime + 7 * 60 * 60 * 1000)
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
const date = tomorrow.toISOString().slice(0, 10)
const slot = (time: string) => Date.parse(`${date}T${time}:00+07:00`)

export const initialStaticData: StaticData = {
  version: 1,
  accounts: [
    {
      id: "demo-user",
      name: "Pengguna Demo",
      email: "pengguna@demo.local",
      role: "user",
      status: "active",
      userKind: "student",
      institutionalId: "2026001",
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
      userKind: "student",
      institutionalId: "2026002",
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
      description: "Studio produksi audio visual yang sedang dalam perawatan.",
      status: "maintenance",
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
        .map(({ id, name, type, location, capacity, description, status }) => ({
          id,
          name,
          type,
          location,
          capacity,
          description,
          status,
        }))
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
      }
    }
    case "facilities:listManaged":
      return state.facilities
    case "reservations:listMine":
      return state.reservations
        .filter((r) => r.userId === account().id)
        .map((r) => ({
          ...r,
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
          applicantName:
            state.accounts.find((a) => a.id === r.userId)?.name ??
            "Pengguna dihapus",
          applicantEmail:
            state.accounts.find((a) => a.id === r.userId)?.email ?? "-",
          facilityName: facilityName(r.facilityId),
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
        }))
        .reverse()
    case "admin:listAccounts":
      return state.accounts
        .filter(
          (a) => !field(args, "status") || a.status === field(args, "status")
        )
        .reverse()
    case "admin:analytics":
      return {
        accounts: state.accounts.length,
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
  key: "facilities" | "reservations" | "reports" | "accounts",
  update: (items: T[]) => T[]
) {
  replace({ ...state, [key]: update(state[key] as T[]) })
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
      requireText(value(args, "purpose"))
      if (
        state.reservations.some(
          (item) =>
            item.facilityId === facilityId &&
            item.status === "approved" &&
            overlaps(item.startAt, item.endAt, startAt, endAt)
        )
      )
        throw new Error("Slot sudah digunakan oleh reservasi lain")
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
        },
      ])
      return id
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
      change<Reservation>("reservations", (items) =>
        items.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
      )
      return null
    }
    case "reservations:decide": {
      requireRole(["officer", "admin"])
      const id = value(args, "reservationId"),
        item = required(state.reservations, id),
        decision = value(args, "decision") as "approved" | "rejected"
      if (item.status !== "pending") throw new Error("Reservasi sudah diproses")
      if (decision === "approved")
        assertFacilityCanApprove(
          required(state.facilities, item.facilityId).status
        )
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
              }
            : decision === "approved" &&
                !alreadyBooked &&
                r.status === "pending" &&
                conflicts(r, item)
              ? { ...r, status: "rejected", decisionNote: AUTO_REJECTION_NOTE }
              : r
        )
      )
      return null
    }
    case "reservations:cancelByStaff": {
      requireRole(["officer", "admin"])
      const id = value(args, "reservationId"),
        item = required(state.reservations, id)
      if (item.status !== "approved")
        throw new Error("Reservasi tidak dapat dibatalkan")
      requireText(value(args, "reason"))
      change<Reservation>("reservations", (items) =>
        items.map((r) =>
          r.id === id
            ? { ...r, status: "cancelled", decisionNote: value(args, "reason") }
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
      requireText(value(args, "note"))
      change<Report>("reports", (items) =>
        items.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                resolutionNote: value(args, "note"),
                updatedAt: now,
              }
            : r
        )
      )
      if (field(args, "facilityMaintenance") !== undefined)
        change<Facility>("facilities", (items) =>
          items.map((f) =>
            f.id === item.facilityId
              ? {
                  ...f,
                  status: field(args, "facilityMaintenance")
                    ? "maintenance"
                    : "active",
                  updatedAt: now,
                }
              : f
          )
        )
      return null
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
  userKind: "student" | "lecturer"
  institutionalId: string
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
      userKind: input.userKind,
      institutionalId: input.institutionalId,
      mustChangePassword: false,
      createdAt: Date.now(),
    },
  ])
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
export function staticCsv(kind: "reservations" | "reports") {
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
  return `\uFEFF${headers.join(",")}\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`
}
export function downloadStaticCsv(kind: "reservations" | "reports") {
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
