"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { PortalRole } from "@/lib/portal-navigation"
import { resetStaticData, setDemoRole } from "@/lib/static-data"

const roles: { role: PortalRole; label: string; href: string }[] = [
  { role: "user", label: "Pengguna", href: "/app" },
  { role: "officer", label: "Petugas", href: "/staff" },
  { role: "admin", label: "Admin", href: "/admin" },
]

export function StaticNavUser({ role }: { role: PortalRole }) {
  const [confirmReset, setConfirmReset] = useState(false)
  function switchRole(next: PortalRole, href: string) {
    setDemoRole(next)
    window.location.assign(href)
  }
  function logout() {
    setDemoRole(null)
    window.location.assign("/login")
  }
  return (
    <div className="space-y-2 rounded-xl border bg-card p-3 text-sm group-data-[collapsible=icon]:hidden">
      <p className="font-semibold">
        Mode demo · {roles.find((item) => item.role === role)?.label}
      </p>
      <label
        className="block text-xs text-muted-foreground"
        htmlFor="demo-role-switch"
      >
        Ganti peran
      </label>
      <select
        id="demo-role-switch"
        className="h-9 w-full rounded-md border bg-background px-2"
        value={role}
        onChange={(event) => {
          const next = roles.find((item) => item.role === event.target.value)!
          switchRole(next.role, next.href)
        }}
      >
        {roles.map((item) => (
          <option key={item.role} value={item.role}>
            {item.label}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="outline"
          onClick={() => setConfirmReset(true)}
        >
          Reset data
        </Button>
        <Button size="xs" variant="ghost" onClick={logout}>
          Keluar
        </Button>
      </div>
      {confirmReset && (
        <div
          role="alertdialog"
          aria-label="Reset data demo"
          className="space-y-2 rounded-lg border p-2"
        >
          <p>Semua perubahan data demo dan foto akan dihapus.</p>
          <div className="flex gap-2">
            <Button
              size="xs"
              variant="destructive"
              onClick={() => {
                void resetStaticData()
                setConfirmReset(false)
              }}
            >
              Reset
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setConfirmReset(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
      <Link
        href="/"
        className="block text-xs text-muted-foreground hover:underline"
      >
        Beranda publik
      </Link>
    </div>
  )
}
