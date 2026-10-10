"use client"

import { useMemo, useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { jakartaDate } from "../../convex/lib/reservationState"
import { useAppMutation, useAppQuery } from "@/lib/data-hooks"
import { toastError } from "@/lib/toast"
import { rangeIsBusy, toTimestamp } from "@/lib/reservation-slots"
import { useScheduleClock } from "@/hooks/use-schedule-clock"
import { ReservationDatePicker } from "./reservation-date-picker"
import { TimeSlotPicker } from "./time-slot-picker"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogCloseButton,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"

export type ChangeReservation = {
  id: Id<"reservations">
  facilityId: Id<"facilities">
  facilityName: string
  startAt: number
  endAt: number
}
const clock = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

export function ScheduleChangeDialog({
  reservation,
  onClose,
}: {
  reservation: ChangeReservation
  onClose: () => void
}) {
  const request = useAppMutation(api.reservations.requestScheduleChange)
  const now = useScheduleClock()
  const [date, setDate] = useState(jakartaDate(reservation.startAt))
  const [range, setRange] = useState({ start: "", end: "" })
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const submitting = useRef(false)
  const rangeStart = toTimestamp(date, "00:00")
  const availability = useAppQuery(api.facilities.getPublicAvailability, {
    facilityId: reservation.facilityId,
    rangeStart,
    rangeEnd: rangeStart + 86400000,
  })
  const busy = useMemo(
    () =>
      availability
        ? [
            ...availability.reservations.filter(
              (item) =>
                item.startAt !== reservation.startAt ||
                item.endAt !== reservation.endAt
            ),
            ...availability.maintenance,
          ]
        : undefined,
    [availability, reservation.startAt, reservation.endAt]
  )
  const startAt = toTimestamp(date, range.start),
    endAt = toTimestamp(date, range.end)
  const ready =
    now !== null &&
    startAt > now &&
    reservation.startAt > now &&
    endAt > startAt &&
    availability?.facilityStatus === "active" &&
    Boolean(busy) &&
    !rangeIsBusy(date, range.start, range.end, busy ?? []) &&
    reason.trim().length > 0 &&
    (startAt !== reservation.startAt || endAt !== reservation.endAt)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!ready || submitting.current) return
    submitting.current = true
    setPending(true)
    setError("")
    try {
      await request({ reservationId: reservation.id, startAt, endAt, reason })
      toast.success("Perubahan jadwal diajukan", {
        description: "Jadwal lama tetap berlaku sampai disetujui.",
      })
      onClose()
    } catch (cause) {
      setError(toastError("Perubahan jadwal gagal", cause))
    } finally {
      submitting.current = false
      setPending(false)
    }
  }
  return (
    <Dialog
      open
      onClose={() => {
        if (!pending) onClose()
      }}
      size="xl"
      labelledBy="change-schedule-title"
    >
      <DialogHeader>
        <div>
          <DialogTitle id="change-schedule-title">
            Ajukan perubahan jadwal
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {reservation.facilityName}
          </p>
        </div>
        <DialogCloseButton
          onClose={() => {
            if (!pending) onClose()
          }}
        />
      </DialogHeader>
      <p className="mb-5 rounded-2xl border border-border bg-muted/30 p-3 text-sm">
        Jadwal lama: {clock.format(reservation.startAt)}–
        {clock.format(reservation.endAt)} WIB. Tetap berlaku sampai petugas
        menyetujui perubahan.
      </p>
      <form onSubmit={submit} className="space-y-5">
        <div className="max-w-xs space-y-2">
          <Label>Tanggal baru</Label>
          <ReservationDatePicker
            value={date}
            onChange={(next) => {
              setDate(next)
              setRange({ start: "", end: "" })
            }}
          />
        </div>
        <TimeSlotPicker
          date={date}
          busy={busy}
          pendingRanges={availability?.pending}
          disabled={
            !availability || availability.facilityStatus !== "active" || pending
          }
          start={range.start}
          end={range.end}
          onChange={setRange}
        />
        {availability && availability.facilityStatus !== "active" && (
          <p role="alert" className="text-sm text-destructive">
            Fasilitas sedang tidak dapat dipesan.
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="change-reason">Alasan perubahan</Label>
          <Textarea
            id="change-reason"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            Batal
          </Button>
          <Button type="submit" disabled={!ready || pending}>
            {pending ? "Mengirim…" : "Ajukan perubahan"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
