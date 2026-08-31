import {
  ArrowRight02Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  File02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { buttonVariants } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { Link } from "react-router-dom"

import { FacilityCard } from "@/components/facility-card"
import { facilities } from "@/mocks/facilities"

const slots = [
  { time: "08.00", available: true },
  { time: "08.30", available: true },
  { time: "09.00", available: false },
  { time: "09.30", available: false },
  { time: "10.00", available: true },
  { time: "10.30", available: true },
]

export function Component() {
  return (
    <>
      <section className="campus-grid relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10" />
        <div className="absolute -top-36 right-0 size-[30rem] rounded-full bg-primary/12 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-18 sm:px-8 sm:py-24 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:py-28">
          <div>
            <Badge
              variant="outline"
              className="page-enter gap-2 border-primary/20 bg-background/70 px-3 py-1.5 text-primary backdrop-blur"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              Sistem fasilitas kampus 2026
            </Badge>
            <h1 className="page-enter stagger-1 mt-6 max-w-3xl text-5xl leading-[0.98] font-black tracking-[-0.065em] text-balance sm:text-6xl xl:text-7xl">
              Temukan ruang. Atur waktu. Jaga kampus.
            </h1>
            <p className="page-enter stagger-2 mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Cek ketersediaan fasilitas tanpa login, ajukan reservasi, dan
              laporkan kerusakan dalam satu jalur yang mudah dipantau.
            </p>
            <div className="page-enter stagger-3 mt-8 flex flex-wrap gap-3">
              <Link to="/facilities" className={buttonVariants({ size: "lg" })}>
                Cek fasilitas
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  data-icon="inline-end"
                  size={18}
                />
              </Link>
              <Link
                to="/register"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Buat akun
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <HugeiconsIcon
                  icon={Clock01Icon}
                  className="text-primary"
                  size={18}
                />
                Slot tetap 30 menit
              </span>
              <span className="inline-flex items-center gap-2">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="text-primary"
                  size={18}
                />
                Jadwal 07.00–20.00 WIB
              </span>
            </div>
          </div>

          <Card className="page-enter stagger-2 relative overflow-hidden border-emerald-900/10 bg-card/88 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-300">
                  Selasa · 01 Sep 2026
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight">
                  Ruang Kolaborasi Arunika
                </h2>
              </div>
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={Calendar03Icon} size={22} />
              </span>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Ketersediaan pagi</span>
                <span className="text-muted-foreground">4 dari 6 tersedia</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
                {slots.map((slot) => (
                  <div
                    key={slot.time}
                    className={cn(
                      "rounded-2xl border px-2 py-3 text-center text-xs font-bold",
                      slot.available
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-muted text-muted-foreground line-through"
                    )}
                  >
                    {slot.time}
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-muted/60 p-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Lokasi</p>
                  <p className="mt-1 font-bold">Gedung A · Lt. 2</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kapasitas</p>
                  <p className="mt-1 font-bold">36 orang</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Detail pemohon dan tujuan penggunaan tidak ditampilkan pada
                kalender publik.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-18 sm:px-8 sm:py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Pilihan hari ini
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
              Ruang untuk setiap kebutuhan.
            </h2>
          </div>
          <Link
            to="/facilities"
            className={buttonVariants({ variant: "outline" })}
          >
            Lihat semua fasilitas
          </Link>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      </section>

      <section className="border-y bg-emerald-950 text-emerald-50">
        <div className="mx-auto grid max-w-7xl gap-px bg-white/10 sm:grid-cols-3">
          {[
            {
              icon: Calendar03Icon,
              title: "Reservasi terjadwal",
              copy: "Pilih fasilitas dan slot dengan aturan waktu yang jelas.",
            },
            {
              icon: File02Icon,
              title: "Laporan terpusat",
              copy: "Kerusakan diteruskan ke petugas dan dapat dipantau.",
            },
            {
              icon: CheckmarkCircle02Icon,
              title: "Status transparan",
              copy: "Setiap keputusan dan perubahan status tercatat.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-emerald-950 p-8 sm:p-10">
              <HugeiconsIcon icon={item.icon} className="text-emerald-300" />
              <h3 className="mt-5 text-lg font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-100/60">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
