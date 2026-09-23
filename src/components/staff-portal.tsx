"use client"

import Link from "next/link"
import { useState } from "react"
import { useAppMutation as useMutation } from "@/lib/data-hooks"
import {
  IconChecklist,
  IconClockHour4,
  IconFileAlert,
  IconProgress,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { DashboardMetricCard } from "@/components/dashboard-metric-card"
import { PortalListSkeleton } from "@/components/portal-skeletons"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useAuthenticatedQuery } from "@/lib/use-authenticated-query"

const labels: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  in_progress: "Ditangani",
  resolved: "Selesai",
}

const jakartaDateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

function formatDate(value: number) {
  return jakartaDateTime.format(value)
}

export function StaffDashboard() {
  const reservations = useAuthenticatedQuery(api.reservations.listQueue, {})
  const reports = useAuthenticatedQuery(api.reports.listQueue, {})

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-[#b00055] uppercase dark:text-pink-300">
            Portal petugas
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Antrean operasional
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Prioritaskan permohonan dan kendala yang perlu ditangani.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm dark:bg-card">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          Sinkron real-time
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardMetricCard
          label="Reservasi menunggu"
          value={
            reservations
              ? reservations.filter((item) => item.status === "pending").length
              : undefined
          }
          description="Permohonan yang membutuhkan keputusan."
          icon={IconClockHour4}
          tone="amber"
        />
        <DashboardMetricCard
          label="Laporan baru"
          value={
            reports
              ? reports.filter((item) => item.status === "pending").length
              : undefined
          }
          description="Laporan yang belum diambil petugas."
          icon={IconFileAlert}
          tone="pink"
        />
        <DashboardMetricCard
          label="Sedang ditangani"
          value={
            reports
              ? reports.filter((item) => item.status === "in_progress").length
              : undefined
          }
          description="Pekerjaan aktif yang perlu dituntaskan."
          icon={IconProgress}
          tone="emerald"
        />
      </div>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-[#b00055] dark:bg-pink-900/40 dark:text-pink-200">
              <IconChecklist className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold">
                Lanjutkan antrean kerja
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Buka antrean sesuai jenis pekerjaan yang ingin diproses.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/staff/reservations" className={buttonVariants()}>
              Reservasi
            </Link>
            <Link
              href="/staff/reports"
              className={buttonVariants({ variant: "outline" })}
            >
              Laporan
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function StaffReservations() {
  const reservations = useAuthenticatedQuery(api.reservations.listQueue, {})
  const decide = useMutation(api.reservations.decide)
  const cancel = useMutation(api.reservations.cancelByStaff)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")

  async function process(
    id: Id<"reservations">,
    action: "approved" | "rejected" | "cancelled"
  ) {
    setMessage("")
    try {
      if (action === "cancelled") {
        await cancel({ reservationId: id, reason: notes[id] ?? "" })
      } else {
        await decide({
          reservationId: id,
          decision: action,
          note: notes[id] || undefined,
        })
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tindakan gagal")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Antrean reservasi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saat satu reservasi disetujui, ajuan lain yang bentrok otomatis
          ditolak.
        </p>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      {!reservations ? (
        <PortalListSkeleton />
      ) : reservations.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Belum ada reservasi.
        </Card>
      ) : (
        <div className="space-y-3">
          {reservations.map((item) => (
            <Card key={item.id} className="gap-3 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{item.facilityName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.applicantName} · {item.applicantEmail}
                  </p>
                </div>
                <Badge
                  variant={item.status === "approved" ? "default" : "secondary"}
                >
                  {labels[item.status]}
                </Badge>
              </div>
              <p className="text-sm">
                {formatDate(item.startAt)} – {formatDate(item.endAt)}
              </p>
              <p className="text-sm text-muted-foreground">{item.purpose}</p>
              {item.decisionNote && (
                <p className="rounded-lg bg-muted p-3 text-sm">
                  {item.decisionNote}
                </p>
              )}
              {(item.status === "pending" || item.status === "approved") && (
                <div className="space-y-2">
                  <Input
                    aria-label="Catatan keputusan"
                    placeholder="Catatan atau alasan"
                    value={notes[item.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    {item.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => process(item.id, "approved")}
                        >
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => process(item.id, "rejected")}
                        >
                          Tolak
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => process(item.id, "cancelled")}
                    >
                      Batalkan
                    </Button>
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

export function StaffReports() {
  const reports = useAuthenticatedQuery(api.reports.listQueue, {})
  const updateStatus = useMutation(api.reports.updateStatus)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [maintenance, setMaintenance] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState("")

  async function process(
    reportId: Id<"reports">,
    status: "in_progress" | "resolved" | "rejected",
    maintenanceOverride?: boolean
  ) {
    setMessage("")
    try {
      await updateStatus({
        reportId,
        status,
        note: notes[reportId] ?? "",
        facilityMaintenance: maintenanceOverride ?? maintenance[reportId],
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pembaruan gagal")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Laporan fasilitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catat progres dan tandai fasilitas dalam perbaikan bila diperlukan.
        </p>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      {!reports ? (
        <PortalListSkeleton />
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Belum ada laporan.
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="gap-3 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{report.facilityName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {report.reporterName} · {report.reporterEmail}
                  </p>
                </div>
                <Badge variant="secondary">{labels[report.status]}</Badge>
              </div>
              <p className="text-sm font-medium">{report.category}</p>
              <p className="text-sm">{report.description}</p>
              {report.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={report.photoUrl}
                  alt="Bukti laporan"
                  className="max-h-72 rounded-lg object-cover"
                />
              )}
              <Input
                aria-label="Catatan penanganan"
                placeholder="Catatan penanganan wajib diisi"
                value={notes[report.id] ?? report.resolutionNote ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({
                    ...current,
                    [report.id]: event.target.value,
                  }))
                }
              />
              <label
                htmlFor={`maintenance-${report.id}`}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  id={`maintenance-${report.id}`}
                  checked={maintenance[report.id] ?? false}
                  onCheckedChange={(checked) =>
                    setMaintenance((current) => ({
                      ...current,
                      [report.id]: checked === true,
                    }))
                  }
                />
                Tandai fasilitas dalam perbaikan
              </label>
              <div className="flex flex-wrap gap-2">
                {report.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => process(report.id, "in_progress")}
                  >
                    Mulai tangani
                  </Button>
                )}
                {report.status === "in_progress" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => process(report.id, "resolved", false)}
                  >
                    Selesaikan + aktifkan fasilitas
                  </Button>
                )}
                {(report.status === "pending" ||
                  report.status === "in_progress") && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => process(report.id, "rejected")}
                  >
                    Tolak
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
