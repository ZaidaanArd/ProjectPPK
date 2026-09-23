"use client"

import Link from "next/link"
import { useState, type FormEvent, type ReactNode } from "react"
import { useAppMutation as useMutation } from "@/lib/data-hooks"
import { isStaticMode } from "@/lib/data-mode"
import { downloadStaticCsv } from "@/lib/static-data"
import {
  IconBuilding,
  IconCalendar,
  IconDownload,
  IconFileAlert,
  IconPencil,
  IconPlus,
  IconUsers,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { DashboardMetricCard } from "@/components/dashboard-metric-card"
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

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  active: "Aktif",
  rejected: "Ditolak",
  disabled: "Nonaktif",
  maintenance: "Perawatan",
  inactive: "Disembunyikan",
}

export function AdminDashboard() {
  const analytics = useAuthenticatedQuery(api.admin.analytics, {})

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b00055] uppercase dark:text-pink-300">
            Portal admin
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Ringkasan sistem
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kondisi akun, fasilitas, reservasi, dan laporan saat ini.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
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
        <PortalListSkeleton rows={2} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <h2 className="font-heading font-bold">Status reservasi</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Distribusi keputusan untuk seluruh pengajuan.
            </p>
            <div className="mt-5 space-y-3">
              {analytics.reservationsByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3 text-sm"
                >
                  <span className="capitalize">
                    {item.status.replace("_", " ")}
                  </span>
                  <strong className="rounded-full bg-background px-2.5 py-1 text-xs text-foreground shadow-sm">
                    {item.count}
                  </strong>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="font-heading font-bold">Penggunaan fasilitas</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Rekap seluruh periode per fasilitas dan lokasi.
            </p>
            <div className="mt-4">
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
}: {
  mode: "create" | "edit"
  draft: FacilityDraft
  message: string
  pending: boolean
  onChange: (draft: FacilityDraft) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
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
  const [createDraft, setCreateDraft] = useState<FacilityDraft | null>(null)
  const [editDraft, setEditDraft] = useState<FacilityEditDraft | null>(null)
  const [createMessage, setCreateMessage] = useState("")
  const [editMessage, setEditMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Kelola fasilitas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambah, ubah, dan atur visibilitas fasilitas.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditDraft(null)
            setCreateMessage("")
            setCreateDraft({ ...emptyFacility })
          }}
        >
          <IconPlus aria-hidden="true" /> Tambah fasilitas
        </Button>
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
          />
        )}
      </Dialog>

      {!facilities ? (
        <PortalListSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {facilities.map((facility) => (
            <Card key={facility.id} className="gap-3 p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{facility.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {facility.location}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">
                    {statusLabel[facility.status]}
                  </Badge>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Ubah ${facility.name}`}
                    title={`Ubah ${facility.name}`}
                    onClick={() => {
                      setCreateDraft(null)
                      setEditMessage("")
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
              </div>
              <p className="text-sm">
                {facility.type} · {facility.capacity} orang
              </p>
              <p className="text-sm text-muted-foreground">
                {facility.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setStatus({
                      facilityId: facility.id,
                      status:
                        facility.status === "active" ? "inactive" : "active",
                    })
                  }
                >
                  {facility.status === "active" ? "Sembunyikan" : "Aktifkan"}
                </Button>
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
              </div>
            </Card>
          ))}
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Kelola akun</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifikasi pendaftaran dan buat akun petugas.
          </p>
        </div>
        <Button
          onClick={() => {
            setMessage("")
            setCreateOpen(true)
          }}
        >
          <IconPlus aria-hidden="true" /> Buat akun
        </Button>
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
        <PortalListSkeleton />
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id} className="gap-3 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{account.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {account.email} · {account.role}
                  </p>
                </div>
                <Badge variant="secondary">{statusLabel[account.status]}</Badge>
              </div>
              {account.institutionalId && (
                <p className="text-sm">
                  {account.userKind === "lecturer" ? "NIP" : "NIM"}:{" "}
                  {account.institutionalId}
                </p>
              )}
              <Input
                aria-label="Alasan tindakan"
                placeholder="Alasan penolakan/nonaktif"
                value={reasons[account.id] ?? ""}
                onChange={(e) =>
                  setReasons((current) => ({
                    ...current,
                    [account.id]: e.target.value,
                  }))
                }
              />
              <div className="flex flex-wrap gap-2">
                {account.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        review({ profileId: account.id, decision: "active" })
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
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
