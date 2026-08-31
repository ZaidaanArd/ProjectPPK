import { Calendar03Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, Outlet } from "react-router-dom"

import { Brand } from "@/components/brand"

export function AuthLayout() {
  return (
    <main className="grid min-h-svh bg-muted/40 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <div className="campus-grid absolute inset-0 opacity-20" />
        <div className="absolute -top-32 -right-24 size-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-primary/15 px-3 py-1.5 text-xs font-bold tracking-wider text-primary uppercase">
            <HugeiconsIcon icon={Calendar03Icon} size={16} />
            Satu jalur layanan
          </span>
          <h1 className="mt-6 text-5xl leading-[1.04] font-black tracking-[-0.055em]">
            Ruang siap pakai, laporan tidak lagi tercecer.
          </h1>
          <ul className="mt-8 grid gap-4 text-sm text-white/70">
            {[
              "Ketersediaan fasilitas dalam slot 30 menit",
              "Riwayat reservasi dan status laporan yang transparan",
              "Alur persetujuan petugas dalam satu dashboard",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-primary/20 text-primary">
                  <HugeiconsIcon icon={Tick02Icon} size={15} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/45">Project PPK · 2026</p>
      </section>
      <section className="flex flex-col p-5 sm:p-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link
            to="/"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Kembali ke beranda
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">
          <Outlet />
        </div>
      </section>
    </main>
  )
}
