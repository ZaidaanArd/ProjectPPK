import Image from "next/image"
import { cn } from "@/lib/utils"

export function BrandLogo({
  className,
  markOnly = false,
}: {
  className?: string
  markOnly?: boolean
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5", className)}
    >
      <Image
        src="/brand/sthana-mark-128.png"
        alt={markOnly ? "Sthana Kampus" : ""}
        width={44}
        height={44}
        className="size-11 object-contain"
      />
      {!markOnly && (
        <span className="text-[17px] leading-[1.02] font-bold tracking-tight">
          <span className="block text-[#52082b]">Sthana</span>
          <span className="block text-[#d00064]">Kampus</span>
        </span>
      )}
    </span>
  )
}
