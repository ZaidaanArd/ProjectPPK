import type { Metadata } from "next"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Building02Icon,
  CalendarCheckIn01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Location01Icon,
  Search01Icon,
  Shield01Icon,
  UserGroupIcon,
  UserIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { facilities, facilityStats, type FacilityStatus } from "@/lib/facilities"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "RuangKampus — Reservasi & Pelaporan Fasilitas Kampus",
  description:
    "Pesan aula, lab, ruang rapat, dan lapangan kampus. Pantau persetujuan dan laporkan kerusakan dalam satu tempat.",
}

const statusVariant: Record<FacilityStatus, "default" | "secondary" | "destructive"> = {
  Tersedia: "default",
  Penuh: "secondary",
  Perawatan: "destructive",
}

const steps = [
  {
    icon: Search01Icon,
    title: "1. Cari fasilitas",
    description:
      "Telusuri daftar aula, lab, ruang rapat, dan lapangan beserta kapasitasnya.",
  },
  {
    icon: CalendarCheckIn01Icon,
    title: "2. Ajukan reservasi",
    description:
      "Pilih tanggal dan jam pakai, isi keperluan acara, lalu kirim pengajuan.",
  },
  {
    icon: CheckmarkCircle02Icon,
    title: "3. Tunggu persetujuan",
    description:
      "Petugas memverifikasi jadwal. Status bisa dipantau dari portal pengguna.",
  },
  {
    icon: Wrench01Icon,
    title: "4. Laporkan kendala",
    description:
      "AC mati atau proyektor rusak? Buat laporan agar cepat ditindaklanjuti.",
  },
] as const

const portals = [
  {
    icon: UserIcon,
    title: "Pengguna",
    description: "Mahasiswa & dosen: kelola reservasi dan laporan kerusakan.",
    href: "/app",
    cta: "Buka portal pengguna",
  },
  {
    icon: UserGroupIcon,
    title: "Petugas",
    description: "Verifikasi reservasi dan tindak lanjuti laporan lapangan.",
    href: "/staff",
    cta: "Buka portal petugas",
  },
  {
    icon: Shield01Icon,
    title: "Admin",
    description: "Kelola data fasilitas, pengguna, dan rekap seluruh aktivitas.",
    href: "/admin",
    cta: "Buka portal admin",
  },
] as const

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-accent/40 via-background to-background">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-24 md:pb-16">
          <Badge variant="secondary" className="mb-5">
            <HugeiconsIcon icon={Building02Icon} size={14} strokeWidth={2} />
            Sistem informasi fasilitas kampus
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Pinjam ruangan kampus tanpa drama antre.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            RuangKampus menggantikan booking lewat chat dan kertas. Cari
            fasilitas yang tersedia, ajukan reservasi, pantau status
            persetujuan, dan laporkan kerusakan — semuanya tercatat rapi.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/facilities"
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              Lihat daftar fasilitas
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2} />
            </Link>
            <Link
              href="/app/reservations/new"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              <HugeiconsIcon icon={CalendarCheckIn01Icon} size={18} strokeWidth={2} />
              Ajukan reservasi
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {facilityStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border bg-card px-5 py-4 ring-1 ring-foreground/5"
              >
                <dt className="order-2 mt-1 text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </dt>
                <dd className="order-1 text-2xl font-semibold tracking-tight md:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Fasilitas unggulan */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              Fasilitas unggulan
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Paling sering dipesan minggu ini
            </h2>
          </div>
          <Link
            href="/facilities"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Semua fasilitas
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Card key={facility.slug} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="secondary">{facility.category}</Badge>
                  <Badge variant={statusVariant[facility.status]}>
                    {facility.status}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{facility.name}</CardTitle>
                <CardDescription>{facility.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={Location01Icon} size={16} strokeWidth={2} />
                    {facility.building}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserGroupIcon} size={16} strokeWidth={2} />
                    {facility.capacity} orang
                  </span>
                </div>
                <Link
                  href="/facilities"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Lihat detail & jadwal
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Alur */}
      <section className="border-y bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            Cara kerja
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">
            Dari cari ruangan sampai laporan beres, empat langkah saja
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl border bg-card p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HugeiconsIcon icon={step.icon} size={20} strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
            Rata-rata pengajuan diverifikasi petugas dalam &lt;24 jam kerja.
          </p>
        </div>
      </section>

      {/* Portal */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Satu sistem, tiga pintu masuk
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Setiap peran punya portal sendiri supaya antrean reservasi dan laporan
          tidak bercampur.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {portals.map((portal) => (
            <Card key={portal.title}>
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <HugeiconsIcon icon={portal.icon} size={20} strokeWidth={2} />
                </span>
                <CardTitle className="mt-3">{portal.title}</CardTitle>
                <CardDescription>{portal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={portal.href}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  {portal.cta}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground md:py-16">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <HugeiconsIcon icon={Wrench01Icon} size={24} strokeWidth={2} />
          </span>
          <h2 className="mx-auto mt-5 max-w-xl text-2xl font-semibold tracking-tight text-balance md:text-3xl">
            Nemu AC mati atau kursi rusak di ruangan?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed opacity-90 md:text-base">
            Jangan cuma difoto buat story. Laporkan lewat RuangKampus supaya
            petugas mencatat, menindaklanjuti, dan memberi kabar progresnya.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/app/reports/new"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              )}
            >
              Buat laporan kerusakan
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              )}
            >
              Daftar dulu, gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
