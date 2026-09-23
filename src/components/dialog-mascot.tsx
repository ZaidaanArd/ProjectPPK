import { cn } from "@/lib/utils"

type DialogMascotMood = "goodbye" | "secure"

export function DialogMascot({
  mood,
  className,
}: {
  mood: DialogMascotMood
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("dialog-mascot", `dialog-mascot--${mood}`, className)}
    />
  )
}
