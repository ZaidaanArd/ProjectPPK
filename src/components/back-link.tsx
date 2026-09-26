import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

export function BackLink({
  href,
  label = "Kembali",
  className,
}: {
  href: string
  label?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 w-fit items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    >
      <IconArrowLeft size={17} aria-hidden="true" />
      {label}
    </Link>
  )
}
