import { buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import Link from "next/link"

import { PageHeading } from "@/components/page-heading"
import { StatusPill } from "@/components/status-pill"

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Laporan saya"
        title="Masalah yang sedang ditangani."
        description="Status laporan diperbarui oleh petugas beserta catatan penyelesaiannya."
        action={
          <Link href="/app/reports/new" className={buttonVariants()}>
            Buat laporan
          </Link>
        }
      />
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] font-bold text-muted-foreground">
              RPT-0118 · PERANGKAT
            </p>
            <p className="mt-1 font-bold">Proyektor tidak menampilkan gambar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ruang Kolaborasi Arunika · 30 Agustus 2026
            </p>
          </div>
          <StatusPill status="in_progress" />
        </CardContent>
      </Card>
    </div>
  )
}
