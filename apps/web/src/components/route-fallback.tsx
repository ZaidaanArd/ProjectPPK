import { Skeleton } from "@workspace/ui/components/skeleton"

export function RouteFallback() {
  return (
    <div className="mx-auto grid min-h-[55svh] max-w-7xl content-center gap-4 px-5 py-14 sm:px-8">
      <Skeleton className="h-5 w-36 rounded-full" />
      <Skeleton className="h-12 max-w-xl rounded-2xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  )
}
