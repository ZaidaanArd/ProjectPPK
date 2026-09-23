"use client"

import Link from "next/link"
import { useState } from "react"
import { IconArrowRight } from "@tabler/icons-react"

import { SthaniFace, type SthaniExpression } from "@/components/sthani-face"
import { Button } from "@/components/ui/button"
import { Dialog, DialogCloseButton, DialogTitle } from "@/components/ui/dialog"
import { portalRoleMeta, type PortalRole } from "@/lib/portal-navigation"

type Step = {
  title: string
  description: string
  href: string
  expression: SthaniExpression
}

const stepsByRole: Record<PortalRole, Step[]> = {
  user: [
    {
      title: "Cari fasilitas",
      description: "Lihat lokasi, kapasitas, dan slot yang tersedia.",
      href: "/facilities",
      expression: "senang",
    },
    {
      title: "Ajukan reservasi",
      description: "Pilih fasilitas dan waktu, lalu tulis tujuan penggunaan.",
      href: "/app/reservations/new",
      expression: "keren",
    },
    {
      title: "Pantau reservasi",
      description: "Lihat keputusan petugas atau batalkan sesuai batas waktu.",
      href: "/app/reservations",
      expression: "bingung",
    },
    {
      title: "Laporkan kendala",
      description: "Kirim masalah fasilitas dan pantau status penanganannya.",
      href: "/app/reports",
      expression: "terkejut",
    },
  ],
  officer: [
    {
      title: "Tinjau reservasi",
      description: "Periksa antrean dan ketersediaan fasilitas.",
      href: "/staff/reservations",
      expression: "bingung",
    },
    {
      title: "Beri keputusan",
      description: "Setujui atau tolak pengajuan dengan catatan bila perlu.",
      href: "/staff/reservations",
      expression: "keren",
    },
    {
      title: "Tangani laporan",
      description: "Perbarui status dan catat penyelesaian kendala.",
      href: "/staff/reports",
      expression: "senang",
    },
  ],
  admin: [
    {
      title: "Kelola fasilitas",
      description: "Atur informasi dan status ketersediaan fasilitas.",
      href: "/admin/facilities",
      expression: "senang",
    },
    {
      title: "Kelola akun",
      description: "Verifikasi pendaftaran dan atur akses pengguna.",
      href: "/admin/users",
      expression: "bingung",
    },
    {
      title: "Lihat rekap",
      description: "Pantau penggunaan fasilitas dan laporan dari ringkasan.",
      href: "/admin",
      expression: "keren",
    },
  ],
}

export function PortalOnboarding({
  role,
  repeat,
  onRepeatChange,
  onClose,
}: {
  role: PortalRole
  repeat: boolean
  onRepeatChange: (repeat: boolean) => void
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const steps = stepsByRole[role]
  const step = steps[index]
  const isLast = index === steps.length - 1

  return (
    <Dialog open onClose={onClose} labelledBy="onboarding-title" size="lg">
      <div className="flex items-start justify-between gap-4">
        <DialogTitle id="onboarding-title" className="text-xl font-bold">
          Panduan {portalRoleMeta[role].label.toLowerCase()}
        </DialogTitle>
        <DialogCloseButton onClose={onClose} />
      </div>
      <div className="mt-7 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <SthaniFace expression={step.expression} className="!w-28" />
        <div>
          <p className="text-xs font-semibold text-[#ab0b58] dark:text-pink-300">
            {index + 1} dari {steps.length}
          </p>
          <h3 className="mt-2 font-heading text-2xl font-bold">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>
          <Link
            href={step.href}
            onClick={onClose}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#b00056] hover:underline dark:text-pink-300"
          >
            Buka halaman <IconArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="mt-8 flex gap-1.5" aria-hidden="true">
        {steps.map((item, stepIndex) => (
          <span
            key={item.title}
            className={`h-1.5 flex-1 rounded-full ${stepIndex <= index ? "bg-[#c6005e]" : "bg-pink-100 dark:bg-white/10"}`}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(event) => onRepeatChange(event.target.checked)}
            className="accent-[#c6005e]"
          />
          Tampilkan tiap masuk
        </label>
        <div className="flex justify-end gap-2">
          {index > 0 ? (
            <Button variant="outline" onClick={() => setIndex(index - 1)}>
              Kembali
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              Lewati
            </Button>
          )}
          <Button onClick={() => (isLast ? onClose() : setIndex(index + 1))}>
            {isLast ? "Selesai" : "Lanjut"}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
