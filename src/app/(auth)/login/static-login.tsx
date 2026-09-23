"use client"

import Link from "next/link"
import { useState } from "react"
import { AuthVisualPanel } from "../auth-visual-panel"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { setDemoRole } from "@/lib/static-data"
import type { PortalRole } from "@/lib/portal-navigation"

const roles: { role: PortalRole; label: string; destination: string }[] = [
  { role: "user", label: "Pengguna", destination: "/app" },
  { role: "officer", label: "Petugas", destination: "/staff" },
  { role: "admin", label: "Admin", destination: "/admin" },
]

export function StaticLogin() {
  const [pending, setPending] = useState(false)
  function enter(role: PortalRole, destination: string) {
    setPending(true)
    setDemoRole(role)
    window.location.assign(destination)
  }

  return (
    <div className="flex min-h-svh bg-background lg:h-svh lg:overflow-hidden">
      <div className="login-form-panel relative z-10 flex flex-1 flex-col items-center overflow-y-auto px-8 pt-24 pb-12 lg:h-svh lg:max-w-[48%] lg:flex-none lg:basis-[48%] lg:rounded-r-2xl xl:basis-[44%]">
        <Link
          href="/"
          className="absolute top-6 left-6 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Kembali
        </Link>
        <div className="my-auto w-full max-w-[380px] space-y-7">
          <div className="flex flex-col items-center gap-3 text-center">
            <BrandLogo markOnly />
            <h1 className="font-heading text-[26px] font-semibold">
              Mode Demo Statis
            </h1>
            <p className="text-sm text-muted-foreground">
              Pilih peran untuk menjelajahi aplikasi tanpa backend. Data demo
              tersimpan di browser ini.
            </p>
          </div>
          <div className="space-y-3">
            {roles.map(({ role, label, destination }) => (
              <Button
                key={role}
                className="w-full rounded-lg"
                variant={role === "user" ? "default" : "outline"}
                disabled={pending}
                onClick={() => enter(role, destination)}
              >
                Masuk sebagai {label}
              </Button>
            ))}
          </div>
          <div className="space-y-3 text-center text-sm">
            <Link
              href="/facilities"
              className="block font-medium text-foreground hover:underline"
            >
              Lihat fasilitas sebagai pengunjung
            </Link>
            <p className="text-muted-foreground">
              Coba formulir pendaftaran?{" "}
              <Link
                href="/register"
                className="font-medium text-foreground hover:underline"
              >
                Daftar demo
              </Link>
            </p>
          </div>
        </div>
      </div>
      <AuthVisualPanel />
    </div>
  )
}
