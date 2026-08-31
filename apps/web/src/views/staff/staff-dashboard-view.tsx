import {
  Calendar03Icon,
  File02Icon,
  TimeScheduleIcon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@workspace/ui/components/card"

import { MetricCard } from "@/components/metric-card"
import { PageHeading } from "@/components/page-heading"

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Meja petugas"
        title="Antrean yang perlu perhatian."
        description="Proses reservasi dan laporan berdasarkan waktu masuk serta urgensi fasilitas."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Reservasi menunggu"
          value="12"
          note="3 masuk hari ini"
          icon={Calendar03Icon}
        />
        <MetricCard
          label="Laporan terbuka"
          value="8"
          note="2 fasilitas dalam perbaikan"
          icon={File02Icon}
        />
        <MetricCard
          label="Rata-rata respons"
          value="2,4j"
          note="Turun 18% minggu ini"
          icon={TimeScheduleIcon}
        />
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-bold">Prioritas berikutnya</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Reservasi Aula Nawasena · 01 Sep, 13.00 WIB · menunggu 48 menit
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
