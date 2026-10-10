"use client"

import { useState } from "react"
import type { Id } from "../../convex/_generated/dataModel"
import { api } from "../../convex/_generated/api"
import { useAppMutation } from "@/lib/data-hooks"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { toastError } from "@/lib/toast"
import { SthaniFace } from "@/components/sthani-face"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function StartReportDialog({
  report,
  note,
  onClose,
  onStarted,
}: {
  report: {
    id: Id<"reports">
    facilityId: Id<"facilities">
    facilityName: string
  } | null
  note: string
  onClose: () => void
  onStarted: () => void
}) {
  const [impact, setImpact] = useState<"usable" | "closed" | null>(null)
  const [notice, setNotice] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const update = useAppMutation(api.reports.updateStatus)
  const preview = useAuthenticatedQuery(
    api.emergencyClosures.previewImpact,
    report && impact === "closed" ? { facilityId: report.facilityId } : "skip"
  )

  async function submit() {
    if (!report || !impact || pending) return
    setPending(true)
    setError("")
    try {
      await update({
        reportId: report.id,
        status: "in_progress",
        note,
        handlingImpact: impact,
        publicNotice: notice,
      })
      onStarted()
      onClose()
    } catch (cause) {
      setError(toastError("Tidak dapat mulai menangani", cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={report !== null}
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto bg-card text-card-foreground">
        <AlertDialogHeader>
          <SthaniFace expression="bingung" className="mx-auto !w-20" />
          <AlertDialogTitle>
            Mulai tangani {report?.facilityName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Pilih dampak pekerjaan pada penggunaan fasilitas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset disabled={pending} className="space-y-3">
          <legend className="sr-only">Dampak penanganan</legend>
          {(
            [
              [
                "usable",
                "Masih bisa digunakan",
                "Pekerjaan dimulai. Jadwal tetap terbuka dan pengguna diberi informasi gangguan.",
              ],
              [
                "closed",
                "Harus ditutup",
                "Jadwal ditutup sampai penanganan selesai dan fasilitas dinyatakan aman.",
              ],
            ] as const
          ).map(([value, title, description]) => (
            <label
              key={value}
              aria-label={title}
              htmlFor={`handling-impact-${value}`}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${impact === value ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <input
                id={`handling-impact-${value}`}
                type="radio"
                name="handling-impact"
                value={value}
                checked={impact === value}
                onChange={() => {
                  setImpact(value)
                  setConfirmed(false)
                }}
                className="mt-1 accent-pink-600"
              />
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="handling-public-notice">
            Keterangan untuk pengguna
          </Label>
          <textarea
            id="handling-public-notice"
            value={notice}
            onChange={(event) => setNotice(event.target.value)}
            disabled={pending}
            required
            maxLength={500}
            placeholder="Contoh: AC sedang diperbaiki."
            className="min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Ditampilkan kepada pengguna. Jangan cantumkan identitas atau data
            pribadi.
          </p>
        </div>
        {impact === "closed" && (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
            {preview ? (
              <p>
                {preview.pending.length} pengajuan,{" "}
                {preview.approvedFuture.length} reservasi disetujui, dan{" "}
                {preview.ongoing.length} kegiatan berlangsung terdampak.
              </p>
            ) : (
              <p>Memuat reservasi terdampak…</p>
            )}
            <p>
              Reservasi terdampak dibatalkan pengelola dan pengguna mendapat
              notifikasi. Dampak diperiksa ulang saat konfirmasi.
            </p>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={pending}
                className="mt-1 accent-pink-600"
              />
              <span>
                Saya mengonfirmasi penutupan dan pembatalan reservasi terdampak.
              </span>
            </label>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <Button
            onClick={() => void submit()}
            disabled={
              pending ||
              !impact ||
              !notice.trim() ||
              (impact === "closed" && (!preview || !confirmed))
            }
          >
            {pending ? "Memproses…" : "Mulai tangani"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
