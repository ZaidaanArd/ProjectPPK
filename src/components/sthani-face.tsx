import { cn } from "@/lib/utils"

export type SthaniExpression =
  | "senang"
  | "bingung"
  | "kesal"
  | "ngantuk"
  | "sedih"
  | "keren"
  | "terkejut"
  | "sayang"

export function SthaniFace({
  expression,
  className,
}: {
  expression: SthaniExpression
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("sthani-face", `sthani-face--${expression}`, className)}
    />
  )
}
