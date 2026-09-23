import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { api } from "../../../../convex/_generated/api"
import { AccountStatusActions } from "@/components/account-status-actions"
import { BrandLogo } from "@/components/brand-logo"
import { Card } from "@/components/ui/card"
import { accountStatusMessage } from "@/lib/account-routing"
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server"

export const metadata: Metadata = {
  title: "Status akun",
  robots: { index: false, follow: false },
}

export default async function AccountStatusPage() {
  if (!(await isAuthenticated())) redirect("/login")
  const profile = await fetchAuthQuery(api.profiles.current)

  if (profile?.status === "active") redirect("/portal")

  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,219,238,0.65),transparent_45%),#fbfafb] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(133,23,78,0.25),transparent_45%),#17131a]">
      <Card className="w-full max-w-md gap-5 rounded-3xl border-pink-200/70 p-6 shadow-xl shadow-pink-950/5 sm:p-8 dark:border-pink-300/15">
        <Link href="/" aria-label="Sthana Kampus — Beranda" className="w-fit">
          <BrandLogo />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Status akun</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {accountStatusMessage(profile?.status ?? null)}
          </p>
          {profile ? (
            <p className="mt-3 truncate text-sm font-medium">{profile.email}</p>
          ) : null}
        </div>
        <AccountStatusActions />
      </Card>
    </main>
  )
}
