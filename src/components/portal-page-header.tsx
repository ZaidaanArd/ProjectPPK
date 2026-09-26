import type { ElementType, ReactNode } from "react"

export function PortalPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  icon: ElementType
  children?: ReactNode
}) {
  return (
    <header className="relative border-b border-border/70 pb-6 sm:pb-7">
      <Icon
        size={88}
        stroke={1}
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-4 hidden text-pink-300/35 lg:block dark:text-pink-300/10"
      />
      <div className="max-w-2xl">
        <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-pink-700 uppercase dark:text-pink-300">
          {eyebrow}
        </p>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {children && (
        <div className="mt-5 flex flex-wrap items-center gap-2">{children}</div>
      )}
    </header>
  )
}
