"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { MaintenanceReminderBanner } from "@/components/disruption-banner"
import { useAppMutation } from "@/lib/data-hooks"
import { reservationTimes, toTimestamp } from "@/lib/reservation-slots"
import { toastError } from "@/lib/toast"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"

function todayJakarta() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function MaintenanceReminderSection({ now }: { now: number }) {
  const windows = useAuthenticatedQuery(api.maintenance.listManaged, {})
  const soon = (windows ?? []).filter(
    (w) => w.status === "scheduled" && w.endAt > now && w.endAt - now <= 60 * 60 * 1000
  )
  if (soon.length === 0) return null
  const fmt = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  })
  return (
    <section aria-label="Pengingat perbaikan" className="space-y-2">
      {soon.map((w) => (
        <MaintenanceReminderSectionItem
          key={w.id}
          facilityName={w.facilityName}
          endLabel={fmt.format(w.endAt).replace(":", ".")}
        />
      ))}
    </section>
  )
}

function MaintenanceReminderSectionItem({
  facilityName,
  endLabel,
}: {
  facilityName: string
  endLabel: string
}) {
  return <MaintenanceReminderBanner facilityName={facilityName} endAtLabel={endLabel} />
}

export function StaffDisruptionPanel() {
  const facilities = useAuthenticatedQuery(api.facilities.listPublic, {})
  const issues = useAuthenticatedQuery(api.facilityIssues.listManaged, {})
  const preview = useAppMutation(api.facilityIssues.previewImpact)
  const createIssue = useAppMutation(api.facilityIssues.create)
  const resolveIssue = useAppMutation(api.facilityIssues.resolve)
  const [facilityId, setFacilityId] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(todayJakarta())
  const [start, setStart] = useState("09:00")
  const [end, setEnd] = useState("")
  const [impact, setImpact] = useState<{ approved: number; pending: number } | null>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  async function checkImpact() {
    if (!facilityId) return setMessage("Pilih fasilitas dulu.")
    setMessage("")
    try {
      const startAt = toTimestamp(date, start)
      const endAt = end ? toTimestamp(date, end) : undefined
      setImpact(await preview({ facilityId: facilityId as Id<"facilities">, startAt, endAt }))
    } catch (error) {
      setMessage(toastError("Gagal menghitung dampak", error))
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!facilityId) return setMessage("Pilih fasilitas dulu.")
    setBusy(true)
    setMessage("")
    try {
      const startAt = toTimestamp(date, start)
      const endAt = end ? toTimestamp(date, end) : undefined
      await createIssue({
        facilityId: facilityId as Id<"facilities">,
        category,
        description,
        startAt,
        endAt,
      })
      toast.success("Gangguan dipublikasikan dan pengguna overlap diberi tahu")
      setCategory("")
      setDescription("")
      setEnd("")
      setImpact(null)
    } catch (error) {
      setMessage(toastError("Gagal mencatat gangguan", error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Gangguan ringan" className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Gangguan ringan ({issues?.filter((i) => i.status === "open").length ?? 0} aktif)
      </h2>
      <Card className="gap-3 p-5">
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="issue-facility">Fasilitas</Label>
            <Select value={facilityId || null} onValueChange={setFacilityId}>
              <SelectTrigger id="issue-facility" className="w-full">
                <SelectValue>{(v: string | null) => v ?? "Pilih fasilitas"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(facilities ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="issue-cat">Kategori</Label>
              <Input
                id="issue-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="AC tidak dingin"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="issue-date">Tanggal dampak</Label>
              <Input id="issue-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="issue-desc">Deskripsi</Label>
            <Textarea
              id="issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AC mati tapi ruangan masih layak dipakai"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="issue-start">Mulai</Label>
              <Select value={start} onValueChange={setStart}>
                <SelectTrigger id="issue-start"><SelectValue>{(v: string | null) => v ?? "Pilih"}</SelectValue></SelectTrigger>
                <SelectContent>
                  {reservationTimes.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(":", ".")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="issue-end">Selesai (kosongkan bila belum tahu)</Label>
              <Select value={end || null} onValueChange={(v) => setEnd(v ?? "")}>
                <SelectTrigger id="issue-end"><SelectValue>{(v: string | null) => v ?? "Belum tahu"}</SelectValue></SelectTrigger>
                <SelectContent>
                  {reservationTimes.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(":", ".")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {impact && (
            <p className="text-sm text-muted-foreground">
              Terdampak: {impact.approved} disetujui, {impact.pending} menunggu. Masih dapat digunakan dipilih otomatis.
            </p>
          )}
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void checkImpact()}>
              Cek dampak
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Mempublikasikan…" : "Catat & publikasikan"}
            </Button>
          </div>
        </form>
      </Card>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {(issues ?? []).filter((i) => i.status === "open").map((issue) => (
          <Card key={issue.id} className="gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{issue.facilityName}</p>
              <Badge variant="secondary">rev{issue.revision}</Badge>
            </div>
            <p className="text-sm">{issue.category} — {issue.description}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast.promise(resolveIssue({ issueId: issue.id }), {
                  loading: "Menutup gangguan…",
                  success: "Gangguan selesai; banner hilang",
                  error: (e) => toastError("Gagal menutup gangguan", e),
                })
              }}
            >
              Selesaikan
            </Button>
          </Card>
        ))}
      </div>
    </section>
  )
}

export function StaffClosurePanel() {
  const facilities = useAuthenticatedQuery(api.facilities.listPublic, {})
  const closures = useAuthenticatedQuery(api.emergencyClosures.listManaged, {})
  const preview = useAppMutation(api.emergencyClosures.previewImpact)
  const closeFacility = useAppMutation(api.emergencyClosures.close)
  const reopen = useAppMutation(api.emergencyClosures.reopen)
  const [facilityId, setFacilityId] = useState("")
  const [reason, setReason] = useState("")
  const [mode, setMode] = useState<"safety" | "long_repair">("safety")
  const [confirmScope, setConfirmScope] = useState(false)
  const [confirmSafe, setConfirmSafe] = useState(false)
  const [impact, setImpact] = useState<{ pending: unknown[]; approvedFuture: unknown[]; ongoing: unknown[] } | null>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  async function check() {
    if (!facilityId) return setMessage("Pilih fasilitas dulu.")
    try {
      setImpact(await preview({ facilityId: facilityId as Id<"facilities"> }) as typeof impact)
      setMessage("")
    } catch (error) {
      setMessage(toastError("Gagal menghitung dampak", error))
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!facilityId || !reason.trim()) return setMessage("Fasilitas dan alasan wajib diisi.")
    if (!confirmScope) return setMessage("Centang konfirmasi cakupan pembatalan.")
    if (mode === "long_repair" && !confirmSafe)
      return setMessage("Untuk perbaikan besar, centang bahwa reservasi lama tetap berlaku.")
    setBusy(true)
    try {
      await closeFacility({
        facilityId: facilityId as Id<"facilities">,
        reason,
        mode,
      })
      toast.success(mode === "safety" ? "Fasilitas ditutup; reservasi terdampak dibatalkan" : "Fasilitas diblokir; pengguna overlap diberi tahu")
      setReason("")
      setConfirmScope(false)
      setConfirmSafe(false)
      setImpact(null)
    } catch (error) {
      setMessage(toastError("Gagal menutup darurat", error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Penutupan darurat" className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Penutupan darurat ({closures?.filter((c) => c.status === "closed").length ?? 0} aktif)
      </h2>
      <Card className="gap-3 p-5">
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="closure-facility">Fasilitas</Label>
            <Select value={facilityId || null} onValueChange={setFacilityId}>
              <SelectTrigger id="closure-facility" className="w-full">
                <SelectValue>{(v: string | null) => v ?? "Pilih fasilitas"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(facilities ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="closure-reason">Alasan wajib</Label>
            <Textarea id="closure-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Kabel listrik berbahaya" />
          </div>
          <div className="grid gap-2">
            <Label>Mode penutupan</Label>
            <label className="flex gap-2 text-sm">
              <input type="radio" checked={mode === "safety"} onChange={() => setMode("safety")} />
              Keselamatan — batalkan otomatis reservasi terdampak
            </label>
            <label className="flex gap-2 text-sm">
              <input type="radio" checked={mode === "long_repair"} onChange={() => setMode("long_repair")} />
              Perbaikan besar tanpa estimasi — blokir baru, existing boleh pilih
            </label>
          </div>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" checked={confirmScope} onChange={(e) => setConfirmScope(e.target.checked)} />
            Saya memahami cakupan pembatalan di preview
          </label>
          {mode === "long_repair" && (
            <label className="flex gap-2 text-sm">
              <input type="checkbox" checked={confirmSafe} onChange={(e) => setConfirmSafe(e.target.checked)} />
              Reservasi lama tetap berlaku sampai pengguna memilih
            </label>
          )}
          {impact && (
            <p className="text-sm text-muted-foreground">
              Preview: {impact.pending.length} menunggu, {impact.approvedFuture.length} disetujui mendatang, {impact.ongoing.length} berlangsung. Dihitung ulang saat eksekusi.
            </p>
          )}
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void check()}>Preview dampak</Button>
            <Button type="submit" variant="destructive" disabled={busy}>{busy ? "Menutup…" : "Tutup darurat"}</Button>
          </div>
        </form>
      </Card>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {(closures ?? []).filter((c) => c.status === "closed").map((c) => (
          <Card key={c.id} className="gap-2 p-4">
            <p className="font-semibold">{c.facilityName}</p>
            <p className="text-sm">{c.reason}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!window.confirm("Fasilitas sudah aman untuk digunakan kembali? Reservasi yang dibatalkan tidak aktif lagi.")) return
                toast.promise(reopen({ closureId: c.id, confirmSafe: true }), {
                  loading: "Membuka kembali…",
                  success: "Fasilitas dibuka kembali",
                  error: (e) => toastError("Gagal membuka kembali", e),
                })
              }}
            >
              Buka kembali (konfirmasi aman)
            </Button>
          </Card>
        ))}
      </div>
    </section>
  )
}
