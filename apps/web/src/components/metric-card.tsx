import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react"
import { Card, CardContent } from "@workspace/ui/components/card"

export function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string
  value: string
  note: string
  icon: HugeiconsIconProps["icon"]
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.05em]">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{note}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={icon} size={20} />
        </span>
      </CardContent>
    </Card>
  )
}
