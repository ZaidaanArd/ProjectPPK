import { buttonVariants } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import Link from "next/link"

import { PageHeading } from "@/components/page-heading"
import { StatusPill } from "@/components/status-pill"

const reservations = [
  {
    id: "RSV-0261",
    facility: "Ruang Kolaborasi Arunika",
    time: "01 Sep · 10.00–11.30",
    status: "approved" as const,
  },
  {
    id: "RSV-0258",
    facility: "Laboratorium Cakrawala",
    time: "03 Sep · 13.00–15.00",
    status: "pending" as const,
  },
  {
    id: "RSV-0242",
    facility: "Aula Nawasena",
    time: "22 Agu · 09.00–11.00",
    status: "cancelled" as const,
  },
]

export function Component() {
  return (
    <div className="page-enter grid gap-8">
      <PageHeading
        eyebrow="Reservasi saya"
        title="Jadwal dan riwayat penggunaan."
        description="Lihat keputusan petugas, detail waktu, dan pembatalan yang pernah dilakukan."
        action={
          <Link href="/app/reservations/new" className={buttonVariants()}>
            Ajukan reservasi
          </Link>
        }
      />
      <div className="grid gap-3">
        {reservations.map((reservation) => (
          <Card key={reservation.id}>
            <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-wider text-muted-foreground">
                  {reservation.id}
                </p>
                <p className="mt-1 font-bold">{reservation.facility}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reservation.time} WIB
                </p>
              </div>
              <StatusPill status={reservation.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
