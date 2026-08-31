import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  File02Icon,
} from "@hugeicons/core-free-icons"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { MetricCard } from "@/components/metric-card"
import { PageHeading } from "@/components/page-heading"
import { StatusPill } from "@/components/status-pill"

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Portal pengguna"
        title="Aktivitas fasilitasmu."
        description="Pantau reservasi mendatang dan laporan yang sedang ditangani petugas."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Reservasi aktif"
          value="2"
          note="1 menunggu persetujuan"
          icon={Calendar03Icon}
        />
        <MetricCard
          label="Laporan terbuka"
          value="1"
          note="Sedang ditangani petugas"
          icon={File02Icon}
        />
        <MetricCard
          label="Selesai bulan ini"
          value="4"
          note="Seluruh aktivitas tercatat"
          icon={CheckmarkCircle02Icon}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reservasi terdekat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold">Ruang Kolaborasi Arunika</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Selasa, 1 September · 10.00–11.30 WIB
            </p>
          </div>
          <StatusPill status="approved" />
        </CardContent>
      </Card>
    </div>
  )
}
