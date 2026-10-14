"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { toast } from "sonner"
import {
  IconAlertTriangle,
  IconCheck,
  IconLock,
  IconLockOpen,
  IconPencil,
  IconShieldExclamation,
  IconTool,
} from "@tabler/icons-react"
import type { FunctionReturnType } from "convex/server"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MaintenanceReminderBanner } from "@/components/disruption-banner"
import { useAppAuth, useAppMutation, useAppQuery } from "@/lib/data-hooks"
import { reservationTimes, toTimestamp } from "@/lib/reservation-slots"
import { toastError } from "@/lib/toast"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { cn } from "@/lib/utils"

export type IssueItem = FunctionReturnType<
  typeof api.facilityIssues.listManaged
>[number]
export type ClosureItem = FunctionReturnType<
  typeof api.emergencyClosures.listManaged
>[number]

/** Matches the server's maintenance reminder (30 minutes before the end). */
export const ENDING_SOON_MS = 30 * 60 * 1000

export function todayJakarta() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

const timeLabel = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
})
const dateTimeLabel = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
})
export const formatDateTime = (value: number) =>
  dateTimeLabel.format(value).replace(/(\d{2}):(\d{2})/, "$1.$2")

/** Admin-dashboard banner for repairs ending within the reminder window. */
export function MaintenanceReminderSection({ now }: { now: number }) {
  const windows = useAuthenticatedQuery(api.maintenance.listManaged, {})
  const soon = (windows ?? []).filter(
    (w) =>
      w.status === "scheduled" &&
      w.endAt > now &&
      w.endAt - now <= ENDING_SOON_MS
  )
  if (soon.length === 0) return null
  return (
    <section aria-label="Pengingat perbaikan" className="space-y-2">
      {soon.map((w) => (
        <MaintenanceReminderBanner
          key={w.id}
          facilityName={w.facilityName}
          endAtLabel={timeLabel.format(w.endAt).replace(":", ".")}
        />
      ))}
    </section>
  )
}

/** One-line explanation of the three ways to take a facility out of use. */
export function OpsLegend() {
  const items = [
    {
      icon: IconAlertTriangle,
      title: "Gangguan ringan",
      text: "Ruang masih bisa dipakai. Hanya pemberitahuan; slot tidak ditutup.",
      tone: "text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-400/15",
    },
    {
      icon: IconTool,
      title: "Jadwal perbaikan",
      text: "Menutup rentang jam yang kosong saja. Maks 7 hari, selesai otomatis.",
      tone: "text-pink-700 bg-pink-100 dark:text-pink-200 dark:bg-pink-400/15",
    },
    {
      icon: IconLock,
      title: "Penutupan darurat",
      text: "Menutup seluruh fasilitas sampai dibuka kembali secara manual.",
      tone: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-400/15",
    },
  ]
  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <li
          key={item.title}
          className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3"
        >
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-xl",
              item.tone
            )}
          >
            <item.icon size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold">{item.title}</span>
            <span className="block text-xs leading-relaxed text-muted-foreground">
              {item.text}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Facility picker that shows names; renders inside modal dialogs. */
function FacilitySelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const facilities = useAuthenticatedQuery(api.facilities.listPublic, {})
  return (
    <Select value={value || null} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>
          {(v: string | null) =>
            facilities?.find((f) => f.id === v)?.name ?? "Pilih fasilitas"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent portalled={false}>
        {(facilities ?? []).map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TimeSelect({
  id,
  value,
  onChange,
  emptyLabel,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  emptyLabel?: string
}) {
  return (
    <Select value={value || null} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>
          {(v: string | null) =>
            v ? v.replace(":", ".") : (emptyLabel ?? "Pilih")
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent portalled={false}>
        {reservationTimes.map((t) => (
          <SelectItem key={t} value={t}>
            {t.replace(":", ".")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DialogIntro({
  icon: Icon,
  tone,
  title,
  titleId,
  description,
  onClose,
}: {
  icon: typeof IconTool
  tone: string
  title: string
  titleId: string
  description: ReactNode
  onClose: () => void
}) {
  return (
    <DialogHeader className="mb-5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            tone
          )}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <DialogTitle id={titleId} className="text-xl font-bold">
            {title}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {description}
          </DialogDescription>
        </div>
      </div>
      <DialogCloseButton onClose={onClose} />
    </DialogHeader>
  )
}

/**
 * Records a minor issue, or revises an open one. Issues only inform people
 * with overlapping bookings; they never block slots.
 */
export function DisruptionDialog({
  open,
  issue,
  onClose,
}: {
  open: boolean
  /** When set, the dialog edits this open issue instead of creating one. */
  issue?: IssueItem | null
  onClose: () => void
}) {
  const { isAuthenticated } = useAppAuth()
  const createIssue = useAppMutation(api.facilityIssues.create)
  const updateIssue = useAppMutation(api.facilityIssues.update)
  const editing = Boolean(issue)
  const startDate = issue
    ? new Date(issue.startAt + 7 * 3600000).toISOString().slice(0, 10)
    : todayJakarta()
  const [facilityId, setFacilityId] = useState(issue?.facilityId ?? "")
  const [category, setCategory] = useState(issue?.category ?? "")
  const [description, setDescription] = useState(issue?.description ?? "")
  const [date, setDate] = useState(startDate)
  const [start, setStart] = useState("09:00")
  const [end, setEnd] = useState(
    issue?.endAt
      ? new Date(issue.endAt + 7 * 3600000).toISOString().slice(11, 16)
      : ""
  )
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const impact = useAppQuery(
    api.facilityIssues.previewImpact,
    isAuthenticated && facilityId && !editing
      ? {
          facilityId: facilityId as Id<"facilities">,
          startAt: toTimestamp(date, start),
          endAt: end ? toTimestamp(date, end) : undefined,
        }
      : "skip"
  )

  function close() {
    if (busy) return
    setMessage("")
    onClose()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!facilityId) return setMessage("Pilih fasilitas dulu.")
    if (!category.trim() || !description.trim())
      return setMessage("Kategori dan deskripsi wajib diisi.")
    setBusy(true)
    setMessage("")
    try {
      if (issue) {
        await updateIssue({
          issueId: issue.id,
          category,
          description,
          ...(end ? { endAt: toTimestamp(date, end) } : { clearEndAt: true }),
        })
        toast.success("Gangguan diperbarui; pengguna terdampak diberi tahu")
      } else {
        await createIssue({
          facilityId: facilityId as Id<"facilities">,
          category,
          description,
          startAt: toTimestamp(date, start),
          endAt: end ? toTimestamp(date, end) : undefined,
        })
        toast.success("Gangguan dicatat; pengguna terdampak diberi tahu")
      }
      setBusy(false)
      onClose()
    } catch (error) {
      setMessage(toastError("Gagal menyimpan gangguan", error))
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={close} size="lg" labelledBy="issue-title">
      <DialogIntro
        icon={IconAlertTriangle}
        tone="bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"
        title={editing ? "Perbarui gangguan" : "Catat gangguan ringan"}
        titleId="issue-title"
        description="Untuk kendala yang tidak membuat ruang berbahaya atau tak bisa dipakai. Slot tetap terbuka; pemegang reservasi yang terdampak mendapat notifikasi."
        onClose={close}
      />
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="issue-facility">Fasilitas</Label>
          {editing ? (
            <p className="rounded-2xl bg-muted/50 px-3 py-2 text-sm font-medium">
              {issue?.facilityName}
            </p>
          ) : (
            <FacilitySelect
              id="issue-facility"
              value={facilityId}
              onChange={setFacilityId}
            />
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="issue-cat">Kategori</Label>
          <Input
            id="issue-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Contoh: AC tidak dingin"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="issue-desc">Deskripsi</Label>
          <Textarea
            id="issue-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: AC mati, ruangan masih layak dipakai"
            rows={3}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="issue-date">Tanggal</Label>
            <Input
              id="issue-date"
              type="date"
              value={date}
              disabled={editing}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="issue-start">Mulai</Label>
            {editing ? (
              <p className="rounded-2xl bg-muted/50 px-3 py-2 text-sm">
                {issue ? formatDateTime(issue.startAt) : ""}
              </p>
            ) : (
              <TimeSelect id="issue-start" value={start} onChange={setStart} />
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="issue-end">Perkiraan selesai</Label>
            <TimeSelect
              id="issue-end"
              value={end}
              onChange={setEnd}
              emptyLabel="Belum tahu"
            />
          </div>
        </div>
        {end && (
          <button
            type="button"
            onClick={() => setEnd("")}
            className="-mt-2 justify-self-end text-xs font-medium text-pink-700 underline-offset-2 hover:underline dark:text-pink-300"
          >
            Kosongkan jam selesai (belum tahu)
          </button>
        )}
        {impact && (
          <p className="rounded-2xl border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Akan diberi tahu: <strong>{impact.approved}</strong> reservasi
            disetujui dan <strong>{impact.pending}</strong> yang menunggu di
            rentang ini.
          </p>
        )}
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Batal
          </Button>
          <Button type="submit" disabled={busy}>
            {busy
              ? "Menyimpan…"
              : editing
                ? "Simpan perubahan"
                : "Catat & beri tahu"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

const closureModes = [
  {
    value: "safety",
    title: "Keselamatan",
    text: "Bahaya atau tidak bisa dipakai sama sekali. Semua reservasi mendatang dan yang sedang berjalan langsung dibatalkan.",
  },
  {
    value: "long_repair",
    title: "Perbaikan besar",
    text: "Lama dan belum ada estimasi. Reservasi baru diblokir; pemegang reservasi lama diberi tahu dan memilih sendiri.",
  },
] as const

/** Closes a whole facility until staff reopen it by hand. */
export function ClosureDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { isAuthenticated } = useAppAuth()
  const closeFacility = useAppMutation(api.emergencyClosures.close)
  const [facilityId, setFacilityId] = useState("")
  const [reason, setReason] = useState("")
  const [mode, setMode] = useState<"safety" | "long_repair">("safety")
  const [understood, setUnderstood] = useState(false)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const impact = useAppQuery(
    api.emergencyClosures.previewImpact,
    isAuthenticated && facilityId
      ? { facilityId: facilityId as Id<"facilities"> }
      : "skip"
  )
  const affected = impact
    ? [
        ...impact.ongoing.map((r) => ({ ...r, label: "Berlangsung" })),
        ...impact.approvedFuture.map((r) => ({ ...r, label: "Disetujui" })),
        ...impact.pending.map((r) => ({ ...r, label: "Menunggu" })),
      ]
    : []

  function reset() {
    setFacilityId("")
    setReason("")
    setMode("safety")
    setUnderstood(false)
    setMessage("")
  }

  function close() {
    if (busy) return
    reset()
    onClose()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!facilityId || !reason.trim())
      return setMessage("Fasilitas dan alasan wajib diisi.")
    if (!understood) return setMessage("Centang konfirmasi dampaknya dulu.")
    setBusy(true)
    setMessage("")
    try {
      await closeFacility({
        facilityId: facilityId as Id<"facilities">,
        reason,
        mode,
      })
      toast.success(
        mode === "safety"
          ? "Fasilitas ditutup; reservasi terdampak dibatalkan"
          : "Fasilitas diblokir; pemegang reservasi diberi tahu"
      )
      setBusy(false)
      reset()
      onClose()
    } catch (error) {
      setMessage(toastError("Gagal menutup fasilitas", error))
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={close} size="xl" labelledBy="closure-title">
      <DialogIntro
        icon={IconShieldExclamation}
        tone="bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300"
        title="Tutup darurat"
        titleId="closure-title"
        description="Menutup seluruh fasilitas sampai dibuka kembali secara manual. Pakai ini bila ruang berbahaya atau perbaikannya lama tanpa estimasi."
        onClose={close}
      />
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="closure-facility">Fasilitas</Label>
          <FacilitySelect
            id="closure-facility"
            value={facilityId}
            onChange={(value) => {
              setFacilityId(value)
              setUnderstood(false)
            }}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="closure-reason">Alasan</Label>
          <Textarea
            id="closure-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: kabel listrik terkelupas di dekat panggung"
            rows={2}
          />
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-medium">
            Jenis penutupan
          </legend>
          <RadioGroup
            value={mode}
            onValueChange={(value) => {
              setMode(value as "safety" | "long_repair")
              setUnderstood(false)
            }}
            className="grid gap-2 sm:grid-cols-2"
          >
            {closureModes.map((option) => (
              <label
                key={option.value}
                htmlFor={`closure-mode-${option.value}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors",
                  mode === option.value
                    ? "border-red-400 bg-red-50/60 dark:border-red-400/50 dark:bg-red-400/10"
                    : "border-border/80 hover:border-red-200"
                )}
              >
                <RadioGroupItem
                  id={`closure-mode-${option.value}`}
                  value={option.value}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {option.text}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>

        {facilityId && (
          <section
            aria-label="Reservasi terdampak"
            className="rounded-2xl border border-border/70 bg-muted/30 p-3"
          >
            <p className="text-sm font-semibold">
              {!impact
                ? "Menghitung dampak…"
                : affected.length === 0
                  ? "Tidak ada reservasi yang terdampak."
                  : `${affected.length} reservasi terdampak — ${
                      mode === "safety"
                        ? "semuanya dibatalkan otomatis"
                        : "pemiliknya diberi tahu dan memilih sendiri"
                    }:`}
            </p>
            {affected.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                {affected.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-1.5"
                  >
                    <span className="truncate">
                      <span className="font-semibold">
                        {item.applicantName}
                      </span>{" "}
                      · {formatDateTime(item.startAt)}–
                      {timeLabel.format(item.endAt).replace(":", ".")}
                    </span>
                    <Badge variant="secondary">{item.label}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Dihitung ulang saat penutupan dijalankan.
            </p>
          </section>
        )}

        <label
          htmlFor="closure-understood"
          className="flex items-start gap-2 text-sm"
        >
          <Checkbox
            id="closure-understood"
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked === true)}
            className="mt-0.5"
          />
          {mode === "safety"
            ? "Saya paham reservasi di atas akan dibatalkan dan tidak kembali otomatis saat fasilitas dibuka."
            : "Saya paham reservasi lama tetap berlaku sampai pemiliknya memilih."}
        </label>
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Batal
          </Button>
          <Button type="submit" variant="destructive" disabled={busy}>
            <IconLock aria-hidden="true" />
            {busy ? "Menutup…" : "Tutup fasilitas"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

export function IssueCard({
  issue,
  onEdit,
}: {
  issue: IssueItem
  onEdit?: (issue: IssueItem) => void
}) {
  const resolveIssue = useAppMutation(api.facilityIssues.resolve)
  const open = issue.status === "open"
  return (
    <Card className="gap-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{issue.facilityName}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatDateTime(issue.startAt)}
            {issue.endAt
              ? ` – ${formatDateTime(issue.endAt)}`
              : " · selesai belum diketahui"}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            open &&
              "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"
          )}
        >
          {open ? "Gangguan aktif" : "Selesai"}
        </Badge>
      </div>
      <p className="text-sm">
        <span className="font-medium">{issue.category}</span> —{" "}
        {issue.description}
      </p>
      <p className="text-xs text-muted-foreground">
        Dicatat oleh {issue.createdByName}
        {issue.revision > 1 && ` · diperbarui ${issue.revision - 1}×`}
      </p>
      {open && (
        <div className="flex flex-wrap gap-2 pt-1">
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(issue)}>
              <IconPencil aria-hidden="true" />
              Perbarui
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              toast.promise(resolveIssue({ issueId: issue.id }), {
                loading: "Menutup gangguan…",
                success: "Gangguan selesai; banner disembunyikan",
                error: (e) => toastError("Gagal menutup gangguan", e),
              })
            }}
          >
            <IconCheck aria-hidden="true" />
            Tandai selesai
          </Button>
        </div>
      )}
    </Card>
  )
}

export function ClosureCard({
  closure,
  onReopen,
}: {
  closure: ClosureItem
  onReopen?: (closure: ClosureItem) => void
}) {
  const active = closure.status === "closed"
  return (
    <Card className="gap-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{closure.facilityName}</p>
          <p className="text-sm text-muted-foreground">
            Ditutup {formatDateTime(closure.closedAt)} oleh{" "}
            {closure.closedByName}
            {closure.reopenedAt &&
              ` · dibuka ${formatDateTime(closure.reopenedAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className={cn(
              active &&
                "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200"
            )}
          >
            {closure.mode === "safety" ? "Keselamatan" : "Perbaikan besar"}
          </Badge>
          {closure.source === "handling" && (
            <Badge variant="outline">Dari laporan</Badge>
          )}
        </div>
      </div>
      <p className="text-sm">{closure.reason}</p>
      {active && onReopen && (
        <div className="pt-1">
          <Button size="sm" variant="outline" onClick={() => onReopen(closure)}>
            <IconLockOpen aria-hidden="true" />
            Buka kembali
          </Button>
        </div>
      )}
    </Card>
  )
}

/** Confirms that a closed facility is safe before reopening it. */
export function ReopenClosureDialog({
  closure,
  onClose,
}: {
  closure: ClosureItem | null
  onClose: () => void
}) {
  const reopen = useAppMutation(api.emergencyClosures.reopen)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    if (!closure) return
    setBusy(true)
    try {
      await reopen({ closureId: closure.id, confirmSafe: true })
      toast.success(`${closure.facilityName} dibuka kembali`)
      onClose()
    } catch (error) {
      toastError("Gagal membuka kembali", error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog
      open={closure !== null}
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <AlertDialogContent className="bg-card text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Buka kembali {closure?.facilityName ?? "fasilitas"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Pastikan fasilitas sudah aman dipakai. Setelah dibuka, slot bisa
            dipesan lagi. Reservasi yang sudah dibatalkan tidak kembali
            otomatis.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={confirm}>
            {busy ? "Membuka…" : "Ya, sudah aman"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
