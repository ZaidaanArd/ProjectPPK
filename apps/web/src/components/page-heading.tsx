import type { ReactNode } from "react"

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-bold tracking-[0.18em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
