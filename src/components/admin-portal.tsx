"use client"

import Link from "next/link"
import Image from "next/image"
import {
  useEffect,
  useState,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from "react"
import { useAppMutation as useMutation } from "@/lib/data-hooks"
import { isStaticMode } from "@/lib/data-mode"
import { downloadStaticCsv, saveStaticPhoto } from "@/lib/static-data"
import { toast } from "sonner"
import { runWithToast, toastError } from "@/lib/toast"
import {
  IconBuilding,
  IconCalendar,
  IconCalendarPlus,
  IconChevronDown,
  IconDownload,
  IconFileAlert,
  IconMapPin,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import {
  DashboardMetricCard,
  DashboardMetricPanel,
} from "@/components/dashboard-metric-card"
import {
  FacilityPhotoField,
  emptyPhoto,
  type FacilityPhotoValue,
} from "@/components/facility-photo-field"
import { PortalPageHeader } from "@/components/portal-page-header"
import { MaintenanceReminderSection } from "@/components/staff-ops-panels"
import { PortalListSkeleton } from "@/components/portal-skeletons"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { facilityImage } from "@/lib/facility-illustrations"
import { cn } from "@/lib/utils"
import { displayDuration } from "@/lib/reservation-slots"
import { useScheduleClock } from "@/hooks/use-schedule-clock"

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  active: "Aktif",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
  in_progress: "Ditangani",
  resolved: "Selesai",
  disabled: "Nonaktif",
  maintenance: "Perawatan",
  inactive: "Disembunyikan",
}

const statusTextClass: Record<string, string> = {
  pending: "text-amber-800 dark:text-amber-300",
  approved: "text-emerald-800 dark:text-emerald-300",
  in_progress: "text-sky-800 dark:text-sky-300",
  resolved: "text-emerald-800 dark:text-emerald-300",
  rejected: "text-red-800 dark:text-red-300",
  cancelled: "text-muted-foreground",
  expired: "text-muted-foreground",
}

const accountRoleLabel: Record<string, string> = {
  user: "Pengguna",
  officer: "Petugas",
  admin: "Admin",
}

function StatusOverviewCard({
  title,
  description,
  icon: Icon,
  items,
}: {
  title: string
  description: string
  icon: ElementType
  items: { status: string; count: number }[]
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return (
    <Card className="gap-0 p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-[#b00055] dark:text-pink-200">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5">
        {items.map((item) => (
          <div
            key={item.status}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-border/70 py-3 text-sm last:border-b-0"
          >
            <span
              className={cn(
                "font-medium",
                statusTextClass[item.status] ?? "text-foreground"
              )}
            >
              {statusLabel[item.status] ?? item.status}
            </span>
            <strong className="font-heading font-semibold tabular-nums">
              {item.count}
            </strong>
            <div
              aria-hidden="true"
              className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-[#b00055] dark:bg-pink-400"
                style={{
                  width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AdminExportMenu() {
  const exports = [
    { kind: "summary", label: "Rekap fasilitas CSV" },
    { kind: "reservations", label: "Reservasi CSV" },
    { kind: "reports", label: "Laporan CSV" },
  ] as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <IconDownload aria-hidden="true" /> Unduh rekap
        <IconChevronDown aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">
        {exports.map(({ kind, label }) => (
          <DropdownMenuItem
            key={kind}
            render={
              isStaticMode ? undefined : (
                <Link
                  href={`/api/admin/export?kind=${kind}`}
                  prefetch={false}
                />
              )
            }
            onClick={isStaticMode ? () => downloadStaticCsv(kind) : undefined}
          >
            <IconDownload aria-hidden="true" /> {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AdminDashboard() {
  const now = useScheduleClock()
  const analytics = useAuthenticatedQuery(api.admin.analytics, {})
  const maximumUsage =
    analytics?.facilityUsage.reduce(
      (maximum, facility) => Math.max(maximum, facility.approvedReservations),
      1
    ) ?? 1

  return (
    <div className="space-y-7">
      <PortalPageHeader
        layout="actions-right"
        eyebrow="Portal admin"
        title="Ringkasan sistem"
        description="Kondisi akun, fasilitas, reservasi, dan laporan saat ini."
        icon={IconBuilding}
      >
        <AdminExportMenu />
      </PortalPageHeader>
      {now !== null && <MaintenanceReminderSection now={now} />}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-5 text-sm"
        aria-live="polite"
      >
        <p>
          {analytics ? (
            <>
              <strong className="font-semibold text-[#b00055] dark:text-pink-200">
                {analytics.pendingAccounts}
              </strong>{" "}
              akun menunggu verifikasi
            </>
          ) : (
            "Memuat verifikasi akun…"
          )}
        </p>
        {analytics && analytics.pendingAccounts > 0 && (
          <Link
            href="/admin/users?status=pending"
            className="rounded-md font-semibold text-[#b00055] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring dark:text-pink-200"
          >
            Tinjau akun <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      <DashboardMetricPanel columns={4}>
        <DashboardMetricCard
          label="Akun"
          value={analytics?.accounts}
          description="Seluruh profil yang tercatat."
          icon={IconUsers}
        />
        <DashboardMetricCard
          label="Fasilitas"
          value={analytics?.facilities}
          description="Ruang dan fasilitas terkelola."
          icon={IconBuilding}
        />
        <DashboardMetricCard
          label="Reservasi"
          value={analytics?.reservations}
          description="Total permohonan reservasi."
          icon={IconCalendar}
        />
        <DashboardMetricCard
          label="Laporan"
          value={analytics?.reports}
          description="Total laporan fasilitas."
          icon={IconFileAlert}
        />
      </DashboardMetricPanel>
      {!analytics ? (
        <PortalListSkeleton rows={2} layout="grid" />
      ) : (
        <div className="space-y-4">
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <StatusOverviewCard
              title="Status reservasi"
              description="Keputusan untuk seluruh pengajuan."
              icon={IconCalendar}
              items={analytics.reservationsByStatus}
            />
            <StatusOverviewCard
              title="Status laporan"
              description="Progres penanganan kendala fasilitas."
              icon={IconFileAlert}
              items={analytics.reportsByStatus}
            />
          </div>
          <Card className="gap-0 p-5 shadow-sm sm:p-6">
            <h2 className="font-heading text-lg font-semibold">
              Penggunaan fasilitas
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Perbandingan reservasi disetujui sepanjang periode pencatatan.
            </p>
            {analytics.facilityUsage.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada fasilitas untuk ditampilkan.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-border/70">
                {analytics.facilityUsage.map((item) => {
                  return (
                    <li
                      key={item.facilityId}
                      className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] sm:gap-6"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold break-words">{item.name}</p>
                        <p className="mt-0.5 text-xs break-words text-muted-foreground">
                          {item.location}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums">
                          {item.approvedReservations}{" "}
                          <span className="font-normal text-muted-foreground">
                            reservasi disetujui
                          </span>
                        </p>
                        <div
                          aria-hidden="true"
                          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className="h-full rounded-full bg-[#b00055] dark:bg-pink-400"
                            style={{
                              width: `${(item.approvedReservations / maximumUsage) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {displayDuration(Math.round(item.reservedMinutes)) ||
                            "0 menit"}{" "}
                          penggunaan · {item.reports} laporan
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

type FacilityDraft = {
  name: string
  type: string
  location: string
  capacity: string
  description: string
  photo: FacilityPhotoValue
}

const emptyFacility: FacilityDraft = {
  name: "",
  type: "",
  location: "",
  capacity: "",
  description: "",
  photo: emptyPhoto,
}

const facilitySortLabels = {
  newest: "Terbaru ditambahkan",
  oldest: "Terlama ditambahkan",
  name: "Nama A–Z",
  capacity: "Kapasitas terbesar",
} as const
type FacilitySort = keyof typeof facilitySortLabels

const facilityAgeLabels = {
  all: "Semua waktu",
  "7": "7 hari terakhir",
  "30": "30 hari terakhir",
  "90": "3 bulan terakhir",
} as const
type FacilityAge = keyof typeof facilityAgeLabels

const DAY_MS = 24 * 60 * 60 * 1000
const addedDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
})

type FacilityEditDraft = FacilityDraft & {
  id: Id<"facilities">
  originalName: string
}

function FacilityForm({
  mode,
  draft,
  message,
  pending,
  onChange,
  onClose,
  onSubmit,
  onDelete,
}: {
  mode: "create" | "edit"
  draft: FacilityDraft
  message: string
  pending: boolean
  onChange: (draft: FacilityDraft) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  onDelete?: () => void
}) {
  const prefix = mode === "create" ? "create-facility" : "edit-facility"

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {mode === "edit" && (
        <div className="flex items-center gap-3 rounded-2xl border border-pink-200/80 bg-pink-50/70 p-4 sm:col-span-2 dark:border-pink-300/15 dark:bg-pink-400/5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-200">
            <IconBuilding size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.12em] text-pink-800 uppercase dark:text-pink-200">
              Data fasilitas terpilih
            </p>
            <p className="mt-1 truncate font-heading font-semibold">
              {draft.name || "Fasilitas tanpa nama"}
            </p>
          </div>
        </div>
      )}
      <Field label="Nama fasilitas" id={`${prefix}-name`}>
        <Input
          id={`${prefix}-name`}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="Contoh: Aula Gedung A"
          disabled={pending}
          required
        />
      </Field>
      <Field label="Tipe" id={`${prefix}-type`}>
        <Input
          id={`${prefix}-type`}
          value={draft.type}
          onChange={(event) => onChange({ ...draft, type: event.target.value })}
          placeholder="Contoh: Aula"
          disabled={pending}
          required
        />
      </Field>
      <Field label="Lokasi" id={`${prefix}-location`}>
        <Input
          id={`${prefix}-location`}
          value={draft.location}
          onChange={(event) =>
            onChange({ ...draft, location: event.target.value })
          }
          placeholder="Contoh: Gedung A · Lantai 2"
          disabled={pending}
          required
        />
      </Field>
      <Field label="Kapasitas" id={`${prefix}-capacity`}>
        <Input
          id={`${prefix}-capacity`}
          type="number"
          min="1"
          step="1"
          value={draft.capacity}
          onChange={(event) =>
            onChange({ ...draft, capacity: event.target.value })
          }
          placeholder="Jumlah orang"
          disabled={pending}
          required
        />
      </Field>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${prefix}-description`}>Deskripsi</Label>
        <Textarea
          id={`${prefix}-description`}
          value={draft.description}
          onChange={(event) =>
            onChange({ ...draft, description: event.target.value })
          }
          placeholder="Jelaskan fungsi, perlengkapan, atau informasi penting fasilitas."
          rows={4}
          disabled={pending}
          required
        />
      </div>
      <FacilityPhotoField
        value={draft.photo}
        onChange={(photo) => onChange({ ...draft, photo })}
        name={draft.name}
        type={draft.type}
        disabled={pending}
      />
      {message && (
        <p
          role="alert"
          className="text-sm font-medium text-destructive sm:col-span-2"
        >
          {message}
        </p>
      )}
      <DialogFooter className="border-t pt-5 sm:col-span-2 dark:border-white/10">
        {mode === "edit" && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={pending}
            className="sm:mr-auto"
          >
            <IconTrash aria-hidden="true" /> Arsipkan ruangan
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Menambahkan…"
              : "Menyimpan…"
            : mode === "create"
              ? "Tambah fasilitas"
              : "Simpan perubahan"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AdminFacilities() {
  const facilities = useAuthenticatedQuery(api.facilities.listManaged, {})
  const createFacility = useMutation(api.facilities.create)
  const updateFacility = useMutation(api.facilities.update)
  const setStatus = useMutation(api.facilities.setStatus)
  const removeFacility = useMutation(api.facilities.remove)
  const generatePhotoUploadUrl = useMutation(
    api.facilities.generatePhotoUploadUrl
  )
  const [sort, setSort] = useState<FacilitySort>("newest")
  const [age, setAge] = useState<FacilityAge>("all")
  // NaN before the clock starts: age filters and the "Baru" badge stay off.
  const now = useScheduleClock() ?? Number.NaN
  const [createDraft, setCreateDraft] = useState<FacilityDraft | null>(null)
  const [editDraft, setEditDraft] = useState<FacilityEditDraft | null>(null)
  const [createMessage, setCreateMessage] = useState("")
  const [editMessage, setEditMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"facilities">
    name: string
  } | null>(null)
  const [deleteMessage, setDeleteMessage] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const searchTerm = search.trim().toLowerCase()
  const visibleFacilities = (facilities ?? [])
    .filter(
      (facility) =>
        (statusFilter === "all" || facility.status === statusFilter) &&
        (age === "all" || now - facility.createdAt <= Number(age) * DAY_MS) &&
        `${facility.name} ${facility.type} ${facility.location}`
          .toLowerCase()
          .includes(searchTerm)
    )
    .sort((a, b) => {
      if (sort === "oldest") return a.createdAt - b.createdAt
      if (sort === "name") return a.name.localeCompare(b.name, "id")
      if (sort === "capacity") return b.capacity - a.capacity
      return b.createdAt - a.createdAt
    })

  /** Uploads a picked photo and returns its storage id. */
  async function uploadPhoto(file: File): Promise<Id<"_storage">> {
    if (isStaticMode) return (await saveStaticPhoto(file)) as Id<"_storage">
    const uploadUrl = await generatePhotoUploadUrl({})
    const upload = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    })
    if (!upload.ok) throw new Error("Unggah foto gagal")
    return ((await upload.json()) as { storageId: Id<"_storage"> }).storageId
  }

  function valuesFrom(draft: FacilityDraft) {
    return {
      name: draft.name,
      type: draft.type,
      location: draft.location,
      capacity: Number(draft.capacity),
      description: draft.description,
    }
  }

  function closeCreateDialog() {
    if (creating) return
    setCreateDraft(null)
    setCreateMessage("")
  }

  function closeEditDialog() {
    if (updating) return
    setEditDraft(null)
    setEditMessage("")
  }

  async function submitCreate(event: FormEvent) {
    event.preventDefault()
    if (!createDraft) return
    setCreating(true)
    setCreateMessage("")
    try {
      const photoStorageId = createDraft.photo.file
        ? await uploadPhoto(createDraft.photo.file)
        : undefined
      await createFacility({ ...valuesFrom(createDraft), photoStorageId })
      toast.success(`Fasilitas ${createDraft.name.trim()} ditambahkan`)
      setCreateDraft(null)
    } catch (error) {
      setCreateMessage(toastError("Fasilitas gagal ditambahkan", error))
    } finally {
      setCreating(false)
    }
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault()
    if (!editDraft) return
    setUpdating(true)
    setEditMessage("")
    setSuccessMessage("")
    try {
      // Omitted keeps the current photo; null switches back to the default.
      const photo = editDraft.photo.file
        ? await uploadPhoto(editDraft.photo.file)
        : editDraft.photo.remove
          ? null
          : undefined
      await updateFacility({
        facilityId: editDraft.id,
        ...valuesFrom(editDraft),
        photo,
      })
      toast.success("Perubahan fasilitas disimpan")
      setEditDraft(null)
    } catch (error) {
      setEditMessage(toastError("Perubahan gagal disimpan", error))
    } finally {
      setUpdating(false)
    }
  }

  function closeDeleteDialog() {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteMessage("")
  }

  async function submitDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteMessage("")
    try {
      await removeFacility({ facilityId: deleteTarget.id })
      setDeleteTarget(null)
      setEditDraft(null)
      setEditMessage("")
      setSuccessMessage(`Fasilitas ${deleteTarget.name} berhasil diarsipkan.`)
      toast.success("Fasilitas diarsipkan")
    } catch (error) {
      setDeleteMessage(toastError("Fasilitas gagal diarsipkan", error))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Data fasilitas"
        title="Kelola fasilitas"
        description="Tambah, ubah, dan atur visibilitas fasilitas."
        icon={IconBuilding}
      >
        <Button
          onClick={() => {
            setEditDraft(null)
            setCreateMessage("")
            setSuccessMessage("")
            setCreateDraft({ ...emptyFacility, photo: { ...emptyPhoto } })
          }}
        >
          <IconPlus aria-hidden="true" /> Tambah fasilitas
        </Button>
      </PortalPageHeader>

      {successMessage && (
        <output className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {successMessage}
        </output>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full flex-none sm:max-w-sm sm:min-w-64 sm:flex-1">
          <IconSearch
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Cari fasilitas"
            placeholder="Cari nama, tipe, atau lokasi"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label id="facility-status-filter-label">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => value && setStatusFilter(value)}
          >
            <SelectTrigger
              aria-labelledby="facility-status-filter-label"
              className="w-40"
            >
              <SelectValue>
                {(value: string | null) =>
                  value === "all"
                    ? "Semua"
                    : (statusLabel[value ?? ""] ?? "Status")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="maintenance">Perawatan</SelectItem>
              <SelectItem value="inactive">Disembunyikan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label id="facility-age-filter-label">Ditambahkan</Label>
          <Select
            value={age}
            onValueChange={(value) => value && setAge(value as FacilityAge)}
          >
            <SelectTrigger
              aria-labelledby="facility-age-filter-label"
              className="w-44"
            >
              <SelectValue>
                {(value: string | null) =>
                  facilityAgeLabels[value as FacilityAge] ?? "Semua waktu"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(facilityAgeLabels) as FacilityAge[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {facilityAgeLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label id="facility-sort-label">Urutkan</Label>
          <Select
            value={sort}
            onValueChange={(value) => value && setSort(value as FacilitySort)}
          >
            <SelectTrigger
              aria-labelledby="facility-sort-label"
              className="w-48"
            >
              <SelectValue>
                {(value: string | null) =>
                  facilitySortLabels[value as FacilitySort] ?? "Urutkan"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(facilitySortLabels) as FacilitySort[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {facilitySortLabels[key]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        {facilities && (
          <p className="pb-2 text-xs text-muted-foreground" aria-live="polite">
            Menampilkan {visibleFacilities.length} dari {facilities.length}{" "}
            fasilitas
          </p>
        )}
      </div>

      <Dialog
        open={Boolean(createDraft)}
        onClose={closeCreateDialog}
        size="lg"
        labelledBy="create-facility-title"
      >
        <DialogHeader className="mb-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconPlus size={21} aria-hidden="true" />
            </span>
            <div>
              <DialogTitle
                id="create-facility-title"
                className="text-xl font-bold"
              >
                Tambah fasilitas
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                Lengkapi informasi fasilitas baru agar dapat ditemukan oleh
                pengguna.
              </DialogDescription>
            </div>
          </div>
          <DialogCloseButton onClose={closeCreateDialog} />
        </DialogHeader>
        {createDraft && (
          <FacilityForm
            mode="create"
            draft={createDraft}
            message={createMessage}
            pending={creating}
            onChange={setCreateDraft}
            onClose={closeCreateDialog}
            onSubmit={submitCreate}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(editDraft)}
        onClose={closeEditDialog}
        size="lg"
        labelledBy="edit-facility-title"
      >
        <DialogHeader className="mb-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-700 dark:bg-pink-400/15 dark:text-pink-200">
              <IconPencil size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-pink-700 uppercase dark:text-pink-200">
                Mode ubah
              </p>
              <DialogTitle
                id="edit-facility-title"
                className="text-xl font-bold"
              >
                {editDraft ? editDraft.originalName : "Ubah fasilitas"}
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                Perbarui informasi fasilitas tanpa mengubah statusnya.
              </DialogDescription>
            </div>
          </div>
          <DialogCloseButton onClose={closeEditDialog} />
        </DialogHeader>
        {editDraft && (
          <FacilityForm
            mode="edit"
            draft={editDraft}
            message={editMessage}
            pending={updating}
            onChange={(draft) => setEditDraft({ ...editDraft, ...draft })}
            onClose={closeEditDialog}
            onSubmit={submitEdit}
            onDelete={() => {
              setDeleteMessage("")
              setDeleteTarget({
                id: editDraft.id,
                name: editDraft.name.trim() || editDraft.originalName,
              })
            }}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={closeDeleteDialog}
        size="md"
        labelledBy="delete-facility-title"
      >
        <DialogHeader className="mb-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <IconTrash size={20} aria-hidden="true" />
            </span>
            <div>
              <DialogTitle
                id="delete-facility-title"
                className="text-xl font-bold"
              >
                Arsipkan ruangan ini?
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                {deleteTarget
                  ? `Fasilitas ${deleteTarget.name} akan dinonaktifkan. Riwayat tetap tersimpan dan fasilitas dapat diaktifkan kembali.`
                  : ""}
              </DialogDescription>
            </div>
          </div>
          <DialogCloseButton onClose={closeDeleteDialog} />
        </DialogHeader>
        {deleteMessage && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {deleteMessage}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={closeDeleteDialog}
            disabled={deleting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={submitDelete}
            disabled={deleting}
          >
            {deleting ? "Mengarsipkan…" : "Ya, arsipkan"}
          </Button>
        </DialogFooter>
      </Dialog>

      {!facilities ? (
        <PortalListSkeleton layout="grid" />
      ) : facilities.length === 0 ? (
        <Card className="items-center border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
          Belum ada fasilitas. Tambahkan fasilitas pertama untuk memulai.
        </Card>
      ) : visibleFacilities.length === 0 ? (
        <Card className="items-center border border-dashed border-border px-6 py-10 text-center text-muted-foreground">
          Tidak ada fasilitas yang cocok dengan pencarian atau filter.
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleFacilities.map((facility) => {
            const image = facilityImage(facility)
            const isNew = now - facility.createdAt <= 7 * DAY_MS
            const openEdit = () => {
              setCreateDraft(null)
              setEditMessage("")
              setSuccessMessage("")
              setEditDraft({
                id: facility.id,
                originalName: facility.name,
                name: facility.name,
                type: facility.type,
                location: facility.location,
                capacity: String(facility.capacity),
                description: facility.description,
                photo: { ...emptyPhoto, currentUrl: facility.photoUrl },
              })
            }
            return (
              <li key={facility.id}>
                <Card
                  className={cn(
                    "group h-full gap-0 overflow-hidden p-0 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                    facility.status === "inactive" && "opacity-75"
                  )}
                >
                  <button
                    type="button"
                    onClick={openEdit}
                    aria-label={`Ubah ${facility.name}`}
                    className="relative block aspect-[16/9] overflow-hidden bg-muted/30 text-left focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:outline-none focus-visible:ring-inset"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      unoptimized={image.isPhoto}
                      sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
                      className={cn(
                        "object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                        !image.isPhoto && "object-top"
                      )}
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                    <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border border-background/70 bg-background/90 shadow-sm backdrop-blur",
                          facility.status === "active" &&
                            "text-emerald-800 dark:text-emerald-300",
                          facility.status === "maintenance" &&
                            "text-amber-800 dark:text-amber-300"
                        )}
                      >
                        {statusLabel[facility.status]}
                      </Badge>
                      {isNew && (
                        <Badge className="bg-pink-600 text-white shadow-sm">
                          Baru
                        </Badge>
                      )}
                    </span>
                    {!image.isPhoto && (
                      <span className="absolute right-3 bottom-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                        Ilustrasi · belum ada foto
                      </span>
                    )}
                    <span className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
                      <IconPencil size={15} aria-hidden="true" />
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h2 className="font-heading text-base font-semibold break-words">
                      {facility.name}
                    </h2>
                    <p className="mt-1 flex items-start gap-1.5 text-sm break-words text-muted-foreground">
                      <IconMapPin
                        size={16}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {facility.location}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{facility.type}</Badge>
                      <Badge variant="secondary" className="gap-1">
                        <IconUsers size={13} aria-hidden="true" />
                        {facility.capacity} orang
                      </Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed break-words text-muted-foreground">
                      {facility.description}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconCalendarPlus size={14} aria-hidden="true" />
                      Ditambahkan {addedDate.format(facility.createdAt)}
                      {facility.updatedAt - facility.createdAt > 60_000 &&
                        ` · diubah ${addedDate.format(facility.updatedAt)}`}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-3">
                      <Button size="sm" variant="outline" onClick={openEdit}>
                        <IconPencil aria-hidden="true" /> Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void runWithToast(
                            () =>
                              setStatus({
                                facilityId: facility.id,
                                status:
                                  facility.status === "active"
                                    ? "inactive"
                                    : "active",
                              }),
                            {
                              success:
                                facility.status === "active"
                                  ? `${facility.name} disembunyikan`
                                  : `${facility.name} diaktifkan`,
                              error: "Status fasilitas gagal diubah",
                            }
                          )
                        }
                      >
                        {facility.status === "active"
                          ? "Sembunyikan"
                          : "Aktifkan"}
                      </Button>
                      {facility.status === "inactive" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          title="Aktifkan fasilitas untuk menjadwalkan perbaikan"
                        >
                          Jadwal perbaikan
                        </Button>
                      ) : (
                        <Link
                          href={`/staff/maintenance?facility=${encodeURIComponent(facility.id)}&schedule=1`}
                          className={buttonVariants({
                            size: "sm",
                            variant: "outline",
                          })}
                        >
                          Jadwal perbaikan
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export function AdminUsers({
  initialStatus = "all",
}: {
  initialStatus?: string
}) {
  const accounts = useAuthenticatedQuery(api.admin.listAccounts, {})
  const review = useMutation(api.admin.reviewAccount)
  const setStatus = useMutation(api.admin.setAccountStatus)
  const createAccount = useMutation(api.admin.createAccount)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [reasonAction, setReasonAction] = useState<{
    id: NonNullable<typeof accounts>[number]["id"]
    kind: "reject" | "disable"
  } | null>(null)
  const [reasonError, setReasonError] = useState("")
  const [actionPending, setActionPending] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"user" | "officer" | "admin">("officer")
  const [message, setMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const searchTerm = search.trim().toLowerCase()
  const visibleAccounts = (accounts ?? []).filter(
    (account) =>
      (statusFilter === "all" || account.status === statusFilter) &&
      `${account.name} ${account.email} ${account.role} ${account.institutionalId ?? ""}`
        .toLowerCase()
        .includes(searchTerm)
  )

  useEffect(() => {
    if (reasonAction) {
      document.getElementById(`account-reason-${reasonAction.id}`)?.focus()
    }
  }, [reasonAction])

  function closeCreateDialog() {
    if (creating) return
    setCreateOpen(false)
    setMessage("")
  }

  function openReasonAction(
    id: NonNullable<typeof accounts>[number]["id"],
    kind: "reject" | "disable"
  ) {
    setReasonError("")
    setReasonAction({ id, kind })
  }

  function cancelReasonAction() {
    const id = reasonAction?.id
    setReasonAction(null)
    setReasonError("")
    document.getElementById(`account-action-${id}`)?.focus()
  }

  async function submitReasonAction(event: FormEvent) {
    event.preventDefault()
    if (!reasonAction || actionPending) return
    const { id, kind } = reasonAction
    const reason = reasons[id]?.trim()
    if (!reason) {
      setReasonError("Alasan wajib diisi.")
      return
    }
    setReasonError("")
    setActionPending(true)
    try {
      if (kind === "reject") {
        await review({ profileId: id, decision: "rejected", reason })
      } else {
        await setStatus({ profileId: id, status: "disabled", reason })
      }
      const accountName = accounts?.find((account) => account.id === id)?.name
      toast.success(
        `Akun ${accountName} ${kind === "reject" ? "ditolak" : "dinonaktifkan"}`
      )
      setReasonAction(null)
      document.getElementById(`account-${id}`)?.focus()
    } catch (error) {
      setReasonError(toastError("Tindakan akun gagal", error))
    } finally {
      setActionPending(false)
    }
  }

  async function submitAccount(event: FormEvent) {
    event.preventDefault()
    setCreating(true)
    setMessage("")
    try {
      await createAccount({ name, email, temporaryPassword: password, role })
      toast.success(`Akun ${name.trim()} dibuat`)
      setName("")
      setEmail("")
      setPassword("")
      setCreateOpen(false)
    } catch (error) {
      setMessage(toastError("Pembuatan akun gagal", error))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Akses pengguna"
        title="Kelola akun"
        description="Verifikasi pendaftaran dan buat akun petugas."
        icon={IconUsers}
      >
        <Button
          onClick={() => {
            setMessage("")
            setCreateOpen(true)
          }}
        >
          <IconPlus aria-hidden="true" /> Buat akun
        </Button>
      </PortalPageHeader>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full min-w-0 lg:flex-1 lg:basis-64">
          <Label htmlFor="account-search">Cari akun</Label>
          <div className="relative mt-1.5">
            <IconSearch
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="account-search"
              aria-label="Cari akun"
              placeholder="Cari nama atau email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label id="account-status-filter-label">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => value && setStatusFilter(value)}
          >
            <SelectTrigger
              aria-labelledby="account-status-filter-label"
              className="w-40"
            >
              <SelectValue>
                {(value: string | null) =>
                  value === "all"
                    ? "Semua"
                    : (statusLabel[value ?? ""] ?? "Status")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="disabled">Nonaktif</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {accounts && (
          <p className="pb-2 text-xs text-muted-foreground" aria-live="polite">
            Menampilkan {visibleAccounts.length} dari {accounts.length} akun
          </p>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={closeCreateDialog}
        size="lg"
        labelledBy="create-account-title"
      >
        <DialogHeader>
          <div>
            <DialogTitle
              id="create-account-title"
              className="text-xl font-bold"
            >
              Buat akun baru
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Akun langsung aktif. Pengguna perlu mengganti password sementara
              setelah login pertama.
            </DialogDescription>
          </div>
          <DialogCloseButton onClose={closeCreateDialog} />
        </DialogHeader>
        <form onSubmit={submitAccount} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" id="account-name">
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={creating}
              required
            />
          </Field>
          <Field label="Email" id="account-email">
            <Input
              id="account-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={creating}
              required
            />
          </Field>
          {!isStaticMode && (
            <Field label="Password sementara" id="account-password">
              <Input
                id="account-password"
                type="text"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={creating}
                required
              />
            </Field>
          )}
          <div className="space-y-1.5">
            <Label id="account-role-label">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => value && setRole(value as typeof role)}
              disabled={creating}
            >
              <SelectTrigger
                id="account-role"
                aria-labelledby="account-role-label"
                className="w-full"
              >
                <SelectValue>
                  {(value: string | null) =>
                    value === "user"
                      ? "Pengguna"
                      : value === "admin"
                        ? "Admin"
                        : "Petugas"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent portalled={false}>
                <SelectItem value="user">Pengguna</SelectItem>
                <SelectItem value="officer">Petugas</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {message && (
            <p
              role="alert"
              className="text-sm font-medium text-destructive sm:col-span-2"
            >
              {message}
            </p>
          )}
          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateDialog}
              disabled={creating}
            >
              Batal
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Membuat akun…" : "Buat akun aktif"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {!accounts ? (
        <PortalListSkeleton layout="grid" />
      ) : accounts.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada akun yang tercatat.
        </Card>
      ) : visibleAccounts.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Tidak ada akun yang cocok dengan pencarian atau status ini.
        </Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {visibleAccounts.map((account) => (
            <Card
              key={account.id}
              id={`account-${account.id}`}
              tabIndex={-1}
              className="gap-0 p-5 transition-shadow duration-200 hover:shadow-lg sm:p-6"
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {account.name.trim().slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold break-words">{account.name}</h2>
                  <p className="text-sm break-all text-muted-foreground">
                    {account.email}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "col-start-2 w-fit sm:col-start-3 sm:row-start-1",
                    account.status === "active" &&
                      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                    account.status === "pending" &&
                      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  )}
                >
                  {statusLabel[account.status]}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                  {accountRoleLabel[account.role] ?? account.role}
                </span>
                {account.institutionalId && (
                  <span className="rounded-md bg-muted px-2.5 py-1">
                    {account.userKind === "lecturer" ? "NIP" : "NIM"}:{" "}
                    {account.institutionalId}
                  </span>
                )}
              </div>
              {(account.status === "pending" ||
                account.status === "active" ||
                account.status === "disabled") && (
                <div className="mt-5 space-y-3 border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    {account.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          disabled={actionPending}
                          onClick={() =>
                            void runWithToast(
                              () =>
                                review({
                                  profileId: account.id,
                                  decision: "active",
                                }),
                              {
                                success: `Akun ${account.name} disetujui`,
                                error: "Persetujuan akun gagal",
                              }
                            )
                          }
                        >
                          Setujui
                        </Button>
                        <Button
                          id={`account-action-${account.id}`}
                          size="sm"
                          variant="destructive"
                          disabled={actionPending}
                          onClick={() => openReasonAction(account.id, "reject")}
                        >
                          Tolak
                        </Button>
                      </>
                    )}
                    {account.status === "active" && (
                      <Button
                        id={`account-action-${account.id}`}
                        size="sm"
                        variant="destructive"
                        disabled={actionPending}
                        onClick={() => openReasonAction(account.id, "disable")}
                      >
                        Nonaktifkan
                      </Button>
                    )}
                    {account.status === "disabled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionPending}
                        onClick={() =>
                          void runWithToast(
                            () =>
                              setStatus({
                                profileId: account.id,
                                status: "active",
                              }),
                            {
                              success: `Akun ${account.name} diaktifkan`,
                              error: "Akun gagal diaktifkan",
                            }
                          )
                        }
                      >
                        Aktifkan
                      </Button>
                    )}
                  </div>
                  {reasonAction?.id === account.id && (
                    <form
                      onSubmit={submitReasonAction}
                      className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`account-reason-${account.id}`}>
                          {reasonAction.kind === "reject"
                            ? "Alasan penolakan"
                            : "Alasan penonaktifan"}
                        </Label>
                        <Input
                          id={`account-reason-${account.id}`}
                          placeholder="Tuliskan alasan tindakan"
                          value={reasons[account.id] ?? ""}
                          onChange={(event) =>
                            setReasons((current) => ({
                              ...current,
                              [account.id]: event.target.value,
                            }))
                          }
                          disabled={actionPending}
                          aria-invalid={Boolean(reasonError)}
                          aria-describedby={
                            reasonError
                              ? `account-error-${account.id}`
                              : undefined
                          }
                        />
                        {reasonError && (
                          <p
                            id={`account-error-${account.id}`}
                            role="alert"
                            className="text-sm text-destructive"
                          >
                            {reasonError}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={actionPending}
                        >
                          {actionPending
                            ? "Menyimpan…"
                            : reasonAction.kind === "reject"
                              ? "Konfirmasi penolakan"
                              : "Konfirmasi nonaktifkan"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelReasonAction}
                          disabled={actionPending}
                        >
                          Batal
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
