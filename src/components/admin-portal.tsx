"use client"

import Link from "next/link"
import Image from "next/image"
import {
  useState,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from "react"
import { useAppMutation as useMutation } from "@/lib/data-hooks"
import { isStaticMode } from "@/lib/data-mode"
import { downloadStaticCsv } from "@/lib/static-data"
import {
  IconBuilding,
  IconCalendar,
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
import { DashboardMetricCard } from "@/components/dashboard-metric-card"
import { PortalPageHeader } from "@/components/portal-page-header"
import { PortalListSkeleton } from "@/components/portal-skeletons"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { facilityIllustration } from "@/lib/facility-illustrations"
import { cn } from "@/lib/utils"

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  active: "Aktif",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  in_progress: "Ditangani",
  resolved: "Selesai",
  disabled: "Nonaktif",
  maintenance: "Perawatan",
  inactive: "Disembunyikan",
}

const statusDotClass: Record<string, string> = {
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  in_progress: "bg-sky-500",
  resolved: "bg-emerald-500",
  rejected: "bg-rose-500",
  cancelled: "bg-muted-foreground/50",
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
  return (
    <Card className="gap-0 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading font-bold">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5">
        {items.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between gap-3 border-b border-border/70 py-3 text-sm last:border-b-0"
          >
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  statusDotClass[item.status] ?? "bg-muted-foreground/50"
                )}
              />
              {statusLabel[item.status] ?? item.status}
            </span>
            <strong className="font-heading font-semibold tabular-nums">
              {item.count}
            </strong>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function AdminDashboard() {
  const analytics = useAuthenticatedQuery(api.admin.analytics, {})

  return (
    <div className="space-y-7">
      <PortalPageHeader
        eyebrow="Portal admin"
        title="Ringkasan sistem"
        description="Kondisi akun, fasilitas, reservasi, dan laporan saat ini."
        icon={IconBuilding}
      >
        {isStaticMode ? (
          <button
            type="button"
            onClick={() => downloadStaticCsv("summary")}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconDownload aria-hidden="true" /> Rekap fasilitas CSV
          </button>
        ) : (
          <Link
            href="/api/admin/export?kind=summary"
            prefetch={false}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconDownload aria-hidden="true" /> Rekap fasilitas CSV
          </Link>
        )}
        {isStaticMode ? (
          <button
            type="button"
            onClick={() => downloadStaticCsv("reservations")}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconDownload aria-hidden="true" /> Reservasi CSV
          </button>
        ) : (
          <Link
            href="/api/admin/export?kind=reservations"
            prefetch={false}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconDownload aria-hidden="true" /> Reservasi CSV
          </Link>
        )}
        {isStaticMode ? (
          <button
            type="button"
            onClick={() => downloadStaticCsv("reports")}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconDownload aria-hidden="true" /> Laporan CSV
          </button>
        ) : (
          <Link
            href="/api/admin/export?kind=reports"
            prefetch={false}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconDownload aria-hidden="true" /> Laporan CSV
          </Link>
        )}
      </PortalPageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          label="Akun"
          value={analytics?.accounts}
          description="Seluruh profil yang tercatat."
          icon={IconUsers}
          tone="berry"
        />
        <DashboardMetricCard
          label="Fasilitas"
          value={analytics?.facilities}
          description="Ruang dan fasilitas terkelola."
          icon={IconBuilding}
          tone="pink"
        />
        <DashboardMetricCard
          label="Reservasi"
          value={analytics?.reservations}
          description="Total permohonan reservasi."
          icon={IconCalendar}
          tone="amber"
        />
        <DashboardMetricCard
          label="Laporan"
          value={analytics?.reports}
          description="Total laporan fasilitas."
          icon={IconFileAlert}
          tone="emerald"
        />
      </div>
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
          <Card className="p-5 sm:p-6">
            <h2 className="font-heading font-bold">Penggunaan fasilitas</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Rekap seluruh periode per fasilitas dan lokasi.
            </p>
            <div className="mt-4 divide-y divide-border/70 lg:hidden">
              {analytics.facilityUsage.map((item) => (
                <div
                  key={item.facilityId}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.location}
                  </p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Disetujui</dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {item.approvedReservations}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Menit</dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {item.reservedMinutes}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Laporan</dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {item.reports}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fasilitas / lokasi</TableHead>
                    <TableHead className="text-right">Disetujui</TableHead>
                    <TableHead className="text-right">Menit</TableHead>
                    <TableHead className="text-right">Laporan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.facilityUsage.map((item) => (
                    <TableRow key={item.facilityId}>
                      <TableCell>
                        <span className="block font-medium">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {item.location}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.approvedReservations}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.reservedMinutes}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.reports}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
}

const emptyFacility: FacilityDraft = {
  name: "",
  type: "",
  location: "",
  capacity: "",
  description: "",
}

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
            <IconTrash aria-hidden="true" /> Hapus ruangan
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
  const visibleFacilities = (facilities ?? []).filter(
    (facility) =>
      (statusFilter === "all" || facility.status === statusFilter) &&
      `${facility.name} ${facility.type} ${facility.location}`
        .toLowerCase()
        .includes(searchTerm)
  )

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
      await createFacility(valuesFrom(createDraft))
      setCreateDraft(null)
    } catch (error) {
      setCreateMessage(
        error instanceof Error ? error.message : "Fasilitas gagal ditambahkan"
      )
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
      await updateFacility({
        facilityId: editDraft.id,
        ...valuesFrom(editDraft),
      })
      setEditDraft(null)
    } catch (error) {
      setEditMessage(
        error instanceof Error ? error.message : "Perubahan gagal disimpan"
      )
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
      setSuccessMessage(`Fasilitas ${deleteTarget.name} berhasil dihapus.`)
    } catch (error) {
      setDeleteMessage(
        error instanceof Error ? error.message : "Fasilitas gagal dihapus"
      )
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
            setCreateDraft({ ...emptyFacility })
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
                Hapus ruangan ini?
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                {deleteTarget
                  ? `Fasilitas ${deleteTarget.name} akan dihapus permanen dari katalog. Tindakan ini tidak dapat dibatalkan.`
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
            {deleting ? "Menghapus…" : "Ya, hapus"}
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
        <div className="columns-1 gap-4 lg:columns-2">
          {visibleFacilities.map((facility) => {
            const illustration = facilityIllustration(
              facility.name,
              facility.type
            )
            return (
              <Card
                key={facility.id}
                className="mb-4 break-inside-avoid gap-0 overflow-hidden p-0 transition-shadow duration-200 hover:shadow-lg"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
                  <Image
                    src={illustration.src}
                    alt={illustration.alt}
                    fill
                    sizes="(max-width: 1023px) 100vw, 50vw"
                    className="object-cover object-top"
                  />
                  <Badge
                    variant="secondary"
                    className={cn(
                      "absolute top-3 right-3 border border-background/70 bg-background/90 shadow-sm backdrop-blur",
                      facility.status === "active" &&
                        "text-emerald-800 dark:text-emerald-300",
                      facility.status === "maintenance" &&
                        "text-amber-800 dark:text-amber-300"
                    )}
                  >
                    {statusLabel[facility.status]}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-heading text-base font-semibold break-words">
                      {facility.name}
                    </h2>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-label={`Ubah ${facility.name}`}
                      title={`Ubah ${facility.name}`}
                      onClick={() => {
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
                        })
                      }}
                    >
                      <IconPencil aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="mt-1 flex items-start gap-1.5 text-sm break-words text-muted-foreground">
                    <IconMapPin
                      size={16}
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    {facility.location}
                  </p>
                  <p className="mt-4 flex items-center gap-1.5 text-sm font-medium">
                    <IconUsers
                      size={16}
                      className="shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {facility.type} · {facility.capacity} orang
                  </p>
                  <p className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">
                    {facility.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setStatus({
                          facilityId: facility.id,
                          status:
                            facility.status === "active"
                              ? "inactive"
                              : "active",
                        })
                      }
                    >
                      {facility.status === "active"
                        ? "Sembunyikan"
                        : "Aktifkan"}
                    </Button>
                    {facility.status !== "maintenance" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setStatus({
                            facilityId: facility.id,
                            status: "maintenance",
                          })
                        }
                      >
                        Perawatan
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
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

export function AdminUsers() {
  const accounts = useAuthenticatedQuery(api.admin.listAccounts, {})
  const review = useMutation(api.admin.reviewAccount)
  const setStatus = useMutation(api.admin.setAccountStatus)
  const createAccount = useMutation(api.admin.createAccount)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"user" | "officer" | "admin">("officer")
  const [message, setMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const searchTerm = search.trim().toLowerCase()
  const visibleAccounts = (accounts ?? []).filter(
    (account) =>
      (statusFilter === "all" || account.status === statusFilter) &&
      `${account.name} ${account.email} ${account.role} ${account.institutionalId ?? ""}`
        .toLowerCase()
        .includes(searchTerm)
  )

  function closeCreateDialog() {
    if (creating) return
    setCreateOpen(false)
    setMessage("")
  }

  async function submitAccount(event: FormEvent) {
    event.preventDefault()
    setCreating(true)
    setMessage("")
    try {
      await createAccount({ name, email, temporaryPassword: password, role })
      setName("")
      setEmail("")
      setPassword("")
      setCreateOpen(false)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Pembuatan akun gagal"
      )
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
        <div className="relative w-full flex-none sm:max-w-sm sm:min-w-64 sm:flex-1">
          <IconSearch
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Cari akun"
            placeholder="Cari nama, email, atau NIM/NIP"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
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
              className="gap-0 p-5 transition-shadow duration-200 hover:shadow-lg sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {account.name.trim().slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold break-words">
                      {account.name}
                    </h2>
                    <p className="text-sm break-all text-muted-foreground">
                      {account.email}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
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
                  {(account.status === "pending" ||
                    account.status === "active") && (
                    <Input
                      aria-label="Alasan tindakan"
                      placeholder={
                        account.status === "pending"
                          ? "Alasan jika ditolak"
                          : "Alasan jika dinonaktifkan"
                      }
                      value={reasons[account.id] ?? ""}
                      onChange={(e) =>
                        setReasons((current) => ({
                          ...current,
                          [account.id]: e.target.value,
                        }))
                      }
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {account.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            review({
                              profileId: account.id,
                              decision: "active",
                            })
                          }
                        >
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            review({
                              profileId: account.id,
                              decision: "rejected",
                              reason: reasons[account.id],
                            })
                          }
                        >
                          Tolak
                        </Button>
                      </>
                    )}
                    {account.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setStatus({
                            profileId: account.id,
                            status: "disabled",
                            reason: reasons[account.id],
                          })
                        }
                      >
                        Nonaktifkan
                      </Button>
                    )}
                    {account.status === "disabled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setStatus({ profileId: account.id, status: "active" })
                        }
                      >
                        Aktifkan
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
