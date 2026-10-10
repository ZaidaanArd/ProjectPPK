"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { api } from "../../convex/_generated/api"
import { changeDeadline } from "../../convex/lib/reservationState"
import type { Id } from "../../convex/_generated/dataModel"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { useAppMutation } from "@/lib/data-hooks"
import { toastError } from "@/lib/toast"
import { useScheduleClock } from "@/hooks/use-schedule-clock"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogCloseButton,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { StatusPill } from "./portal-cards"

const labels: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
}
const formatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})
function schedule(start: number, end: number) {
  return `${formatter.format(start)}–${formatter.format(end)} WIB`
}

export function ScheduleChangePanel({ staff = false }: { staff?: boolean }) {
  const items = useAuthenticatedQuery(api.reservations.listScheduleChanges, {})
  const decide = useAppMutation(api.reservations.decideScheduleChange)
  const cancel = useAppMutation(api.reservations.cancelScheduleChange)
  const now = useScheduleClock()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const submitting = useRef(false)
  const [action, setAction] = useState<{
    id: Id<"reservationChanges">
    decision: "approved" | "rejected" | "cancelled"
    note: string
  } | null>(null)
  const selected = items?.find((item) => item.id === action?.id)
  const rows = (items ?? []).map((item) => ({
    ...item,
    status:
      item.status === "pending" && now !== null && changeDeadline(item) <= now
        ? "expired"
        : item.status,
  }))
  const active = rows.filter((item) => item.status === "pending")
  const history = rows.filter((item) => item.status !== "pending")
  function confirm(
    id: Id<"reservationChanges">,
    decision: "approved" | "rejected" | "cancelled"
  ) {
    const note = notes[id]?.trim() ?? ""
    if (decision === "rejected" && !note) {
      setMessage("Alasan penolakan wajib diisi.")
      document.getElementById(`change-note-${id}`)?.focus()
      return
    }
    setMessage("")
    setAction({ id, decision, note })
  }
  async function execute() {
    if (!action || submitting.current) return
    submitting.current = true
    setPending(true)
    setMessage("")
    try {
      if (action.decision === "cancelled") await cancel({ changeId: action.id })
      else
        await decide({
          changeId: action.id,
          decision: action.decision,
          note: action.note,
        })
      toast.success(
        action.decision === "approved"
          ? "Jadwal baru disetujui"
          : "Perubahan jadwal diproses"
      )
      setAction(null)
    } catch (error) {
      setMessage(toastError("Perubahan jadwal gagal diproses", error))
    } finally {
      submitting.current = false
      setPending(false)
    }
  }
  if (!items?.length) return null
  const cards = (list: typeof rows) =>
    list.map((item) => (
      <article
        key={item.id}
        className="rounded-2xl border border-border bg-card p-4"
        data-testid="schedule-change-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{item.facilityName}</h3>
            {staff && (
              <p className="text-sm text-muted-foreground">
                {item.applicantName}
              </p>
            )}
          </div>
          <StatusPill
            status={item.status}
            label={labels[item.status] ?? item.status}
          />
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">
              Jadwal saat diajukan
            </dt>
            <dd>{schedule(item.originalStartAt, item.originalEndAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Jadwal baru</dt>
            <dd>{schedule(item.startAt, item.endAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Alasan</dt>
            <dd className="break-words whitespace-pre-wrap">{item.reason}</dd>
          </div>
        </dl>
        {item.decisionNote && (
          <p className="mt-3 text-sm">{item.decisionNote}</p>
        )}
        {item.status === "pending" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Jadwal lama tetap berlaku sampai perubahan disetujui.
            </p>
            {staff ? (
              <>
                <Label htmlFor={`change-note-${item.id}`}>
                  Catatan keputusan
                </Label>
                <Textarea
                  id={`change-note-${item.id}`}
                  value={notes[item.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending || now === null}
                    onClick={() => confirm(item.id, "approved")}
                  >
                    Setujui perubahan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending || now === null}
                    onClick={() => confirm(item.id, "rejected")}
                  >
                    Tolak perubahan
                  </Button>
                </div>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={pending || now === null}
                onClick={() => confirm(item.id, "cancelled")}
              >
                Batalkan perubahan
              </Button>
            )}
          </div>
        )}
      </article>
    ))
  return (
    <section aria-labelledby="schedule-changes-heading" className="space-y-3">
      <h2
        id="schedule-changes-heading"
        className="font-heading text-xl font-semibold"
      >
        Perubahan jadwal{active.length > 0 ? ` (${active.length})` : ""}
      </h2>
      {message && !action && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-2">{cards(active)}</div>
      {history.length > 0 && (
        <details className="rounded-2xl border border-border p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Riwayat perubahan ({history.length})
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">{cards(history)}</div>
        </details>
      )}
      <Dialog
        open={Boolean(action)}
        onClose={() => {
          if (!pending) setAction(null)
        }}
        labelledBy="change-decision-title"
      >
        <DialogHeader>
          <DialogTitle id="change-decision-title">
            {action?.decision === "approved"
              ? "Setujui jadwal baru?"
              : action?.decision === "rejected"
                ? "Tolak perubahan?"
                : "Batalkan perubahan?"}
          </DialogTitle>
          <DialogCloseButton
            onClose={() => {
              if (!pending) setAction(null)
            }}
          />
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {action?.decision === "approved" && selected
            ? `Jadwal ${schedule(selected.originalStartAt, selected.originalEndAt)} akan diganti ke ${schedule(selected.startAt, selected.endAt)}. Slot lama dilepas setelah berhasil.`
            : "Jadwal reservasi lama tetap berlaku."}
        </p>
        {action?.note && <p className="mt-3 text-sm">{action.note}</p>}
        {message && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setAction(null)}
          >
            Batal
          </Button>
          <Button disabled={pending} onClick={() => void execute()}>
            {pending ? "Memproses…" : "Konfirmasi"}
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
