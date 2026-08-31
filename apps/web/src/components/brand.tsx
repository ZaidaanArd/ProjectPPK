import { Building03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="RuangKampus, kembali ke beranda"
      className="group inline-flex items-center gap-3"
    >
      <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:-rotate-3">
        <HugeiconsIcon icon={Building03Icon} size={20} strokeWidth={2} />
      </span>
      {compact ? null : (
        <span className="leading-none">
          <span className="block text-[10px] font-semibold tracking-[0.22em] text-emerald-700 uppercase dark:text-emerald-300">
            Layanan kampus
          </span>
          <span className="mt-1 block text-base font-black tracking-[-0.03em]">
            RuangKampus
          </span>
        </span>
      )}
    </Link>
  )
}
