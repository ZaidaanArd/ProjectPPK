"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, type FormEvent, type ReactNode } from "react"
import { useMutation } from "convex/react"
import {
  IconBuilding,
  IconCalendar,
  IconChartBar,
  IconClipboardCheck,
  IconFileAlert,
  IconHome,
  IconKey,
  IconLogout,
  IconMenu2,
  IconUsers,
  IconX,
} from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type Role = "user" | "officer" | "admin"

const navigation = {
  user: [
    { href: "/app", label: "Beranda", icon: IconHome },
    { href: "/app/reservations", label: "Reservasi", icon: IconCalendar },
    { href: "/app/reports", label: "Laporan", icon: IconFileAlert },
  ],
  officer: [
    { href: "/staff", label: "Beranda", icon: IconHome },
    {
      href: "/staff/reservations",
      label: "Antrean reservasi",
      icon: IconClipboardCheck,
    },
    { href: "/staff/reports", label: "Laporan", icon: IconFileAlert },
  ],
  admin: [
    { href: "/admin", label: "Ringkasan", icon: IconChartBar },
    { href: "/admin/facilities", label: "Fasilitas", icon: IconBuilding },
    { href: "/admin/users", label: "Akun", icon: IconUsers },
  ],
} satisfies Record<
  Role,
  Array<{ href: string; label: string; icon: typeof IconHome }>
>

function PasswordDialog({ required }: { required: boolean }) {
  const changePassword = useMutation(api.profiles.changePassword)
  const [open, setOpen] = useState(required)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage("")
    setPending(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setMessage("Password berhasil diperbarui.")
      setCurrentPassword("")
      setNewPassword("")
      setOpen(false)
    } catch {
      setMessage("Password lama tidak sesuai atau password baru tidak valid.")
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => setOpen(true)}
      >
        <IconKey aria-hidden="true" />
        Ganti password
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          if (!required) setOpen(false)
        }}
        labelledBy="password-dialog-title"
        size="md"
      >
        <DialogHeader>
          <div>
            <DialogTitle id="password-dialog-title">
              {required ? "Buat password baru" : "Ganti password"}
            </DialogTitle>
            <DialogDescription>
              {required
                ? "Password sementara harus diganti sebelum melanjutkan."
                : "Gunakan minimal 8 karakter untuk password baru."}
            </DialogDescription>
          </div>
          {!required && <DialogCloseButton onClose={() => setOpen(false)} />}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Password saat ini</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Password baru</Label>
            <Input
              id="new-password"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Menyimpan…" : "Simpan password"}
          </Button>
        </form>
      </Dialog>
    </>
  )
}

export function PortalShell({
  children,
  profile,
}: {
  children: ReactNode
  profile: {
    name: string
    email: string
    role: Role
    mustChangePassword: boolean
  }
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function logout() {
    await authClient.signOut()
    router.replace("/login")
    router.refresh()
  }

  const links = navigation[profile.role]

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href={links[0].href} aria-label="Sthana Kampus">
            <BrandLogo className="h-9 w-auto" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Buka navigasi"
          >
            {mobileOpen ? <IconX /> : <IconMenu2 />}
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl md:grid-cols-[240px_1fr]">
        <aside
          className={cn(
            "border-r bg-background p-4 md:block md:min-h-[calc(100svh-4rem)]",
            mobileOpen ? "block" : "hidden"
          )}
        >
          <div className="mb-5 px-3">
            <p className="truncate text-sm font-semibold">{profile.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.email}
            </p>
          </div>
          <nav className="space-y-1" aria-label="Portal">
            {links.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== links[0].href && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-6 space-y-1 border-t pt-4">
            <PasswordDialog required={profile.mustChangePassword} />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive"
              onClick={logout}
            >
              <IconLogout aria-hidden="true" />
              Keluar
            </Button>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
