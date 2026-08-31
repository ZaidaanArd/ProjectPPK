import {
  ArrowRight02Icon,
  Building02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Facility } from "@workspace/contracts"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import { StatusPill } from "@/components/status-pill"

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Card className="group overflow-hidden bg-card/90 py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="campus-grid relative h-28 overflow-hidden border-b bg-secondary/60">
        <div className="absolute -top-8 -right-6 size-32 rounded-full bg-primary/10 blur-2xl" />
        <span className="absolute bottom-4 left-5 grid size-11 place-items-center rounded-2xl border border-primary/20 bg-background/80 text-primary backdrop-blur">
          <HugeiconsIcon icon={Building02Icon} size={22} />
        </span>
      </div>
      <CardHeader className="gap-3 px-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
              {facility.type}
            </p>
            <h3 className="mt-1 text-lg font-extrabold tracking-[-0.025em]">
              {facility.name}
            </h3>
          </div>
          <StatusPill status={facility.status} />
        </div>
      </CardHeader>
      <CardContent className="px-5">
        <p className="text-sm leading-6 text-muted-foreground">
          {facility.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
          <span>{facility.location}</span>
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={UserGroupIcon} size={15} />
            {facility.capacity} orang
          </span>
        </div>
      </CardContent>
      <CardFooter className="mt-1 border-t px-5 py-4">
        <Link
          href={`/facilities?selected=${facility.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-3 text-primary"
          )}
        >
          Lihat jadwal
          <HugeiconsIcon
            icon={ArrowRight02Icon}
            data-icon="inline-end"
            size={16}
          />
        </Link>
      </CardFooter>
    </Card>
  )
}
