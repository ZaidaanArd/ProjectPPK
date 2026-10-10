"use client"

import { useState } from "react"
import { toast } from "sonner"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { ClosureBanner, DisruptionBanner } from "@/components/disruption-banner"
import { useAppMutation } from "@/lib/data-hooks"
import { toastError } from "@/lib/toast"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"
import { overlaps } from "../../convex/lib/reservationTime"

export function ReservationDisruptionActions({
  reservationId,
  facilityId,
  status,
  startAt,
  endAt,
}: {
  reservationId: Id<"reservations">
  facilityId: Id<"facilities">
  status: string
  startAt: number
  endAt: number
}) {
  const issues = useAuthenticatedQuery(api.facilityIssues.listOpen, { facilityId })
  const closures = useAuthenticatedQuery(api.emergencyClosures.listActiveForFacility, {
    facilityId,
  })
  const cancelForIssue = useAppMutation(api.reservations.cancelMineForDisruption)
  const cancelForClosure = useAppMutation(api.emergencyClosures.cancelMineForClosure)
  const [busy, setBusy] = useState<string | null>(null)

  if (status !== "approved" && status !== "pending") return null
  const openIssues = (issues ?? []).filter((issue) =>
    overlaps(startAt, endAt, issue.startAt, issue.endAt ?? Number.MAX_SAFE_INTEGER)
  )
  const activeClosures = closures ?? []
  if (openIssues.length === 0 && activeClosures.length === 0) return null

  async function cancelIssue(issueId: Id<"facilityIssues">) {
    setBusy(issueId as string)
    try {
      await cancelForIssue({ reservationId, issueId })
      toast.success("Reservasi dibatalkan karena gangguan")
    } catch (error) {
      toastError("Gagal membatalkan karena gangguan", error)
    } finally {
      setBusy(null)
    }
  }

  async function cancelClosure(closureId: Id<"emergencyClosures">) {
    setBusy(closureId as string)
    try {
      await cancelForClosure({ reservationId, closureId })
      toast.success("Reservasi dibatalkan karena penutupan")
    } catch (error) {
      toastError("Gagal membatalkan karena penutupan", error)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2">
      {openIssues.map((issue) => (
        <div key={issue.id} className="space-y-2">
          <DisruptionBanner category={issue.category} description={issue.description} />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void cancelIssue(issue.id)}
            >
              {busy === (issue.id as string) ? "Membatalkan…" : "Batalkan karena gangguan"}
            </Button>
          </div>
        </div>
      ))}
      {activeClosures.map((closure) => (
        <div key={closure.id} className="space-y-2">
          <ClosureBanner reason={closure.reason} />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void cancelClosure(closure.id)}
            >
              {busy === (closure.id as string) ? "Membatalkan…" : "Batalkan (fasilitas ditutup)"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Tetap menunggu juga boleh; reservasi tidak berubah bila tidak dibatalkan.
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
