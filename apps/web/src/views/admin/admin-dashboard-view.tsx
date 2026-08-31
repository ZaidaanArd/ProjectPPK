import {
  AnalyticsUpIcon,
  Building02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { MetricCard } from "@/components/metric-card"
import { PageHeading } from "@/components/page-heading"

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Panel admin"
        title="Kesehatan operasional kampus."
        description="Ringkasan okupansi, kondisi fasilitas, dan akun yang masih menunggu verifikasi."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Okupansi minggu ini"
          value="68%"
          note="Naik 7% dari minggu lalu"
          icon={AnalyticsUpIcon}
        />
        <MetricCard
          label="Fasilitas aktif"
          value="42"
          note="2 dalam perbaikan"
          icon={Building02Icon}
        />
        <MetricCard
          label="Verifikasi akun"
          value="6"
          note="Menunggu keputusan admin"
          icon={UserGroupIcon}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Okupansi per hari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-44 items-end gap-3">
            {[42, 68, 54, 81, 73, 36, 28].map((value, index) => (
              <div
                key={index}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="relative h-36 w-full overflow-hidden rounded-xl bg-primary/20">
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-xl bg-primary"
                    style={{ height: `${value}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][index]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
