"use client"

import Link from "next/link"
import { useAppAuth as useConvexAuth } from "@/lib/data-hooks"
import { IconArrowRight } from "@tabler/icons-react"

export function PublicAccountLinks({
  placement,
  onNavigate,
}: {
  placement: "header" | "mobile" | "footer"
  onNavigate?: () => void
}) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading || isAuthenticated) {
    return (
      <Link
        href="/portal"
        onClick={onNavigate}
        className={
          placement === "header" ? "sthana-button primary small" : undefined
        }
      >
        Buka portal
        {placement === "header" ? (
          <IconArrowRight size={16} aria-hidden="true" />
        ) : null}
      </Link>
    )
  }

  if (placement === "header") {
    return (
      <>
        <Link href="/login" className="header-login">
          Masuk
        </Link>
        <Link href="/register" className="sthana-button primary small">
          Daftar akun <IconArrowRight size={16} aria-hidden="true" />
        </Link>
      </>
    )
  }

  return (
    <>
      <Link href="/login" onClick={onNavigate}>
        Masuk
      </Link>
      <Link href="/register" onClick={onNavigate}>
        Daftar akun
      </Link>
    </>
  )
}
