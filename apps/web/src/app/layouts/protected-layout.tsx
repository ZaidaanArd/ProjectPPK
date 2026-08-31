import type { UserRole } from "@workspace/contracts"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useSession } from "@/features/auth/session"

export function ProtectedLayout({ roles }: { roles: UserRole[] }) {
  const session = useSession()
  const location = useLocation()

  if (session.isPending) {
    return (
      <div className="grid min-h-svh place-items-center bg-muted/40 p-6">
        <div className="grid w-full max-w-xl gap-4">
          <Skeleton className="h-12 w-52 rounded-2xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    )
  }

  const user = session.data?.user
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
