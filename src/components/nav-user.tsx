"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconCheck,
  IconHome,
  IconKey,
  IconLogout,
  IconPlus,
  IconSelector,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MAX_DEVICE_ACCOUNTS } from "@/lib/account-routing"
import {
  getActiveSessionToken,
  getDeviceAccounts,
  isLegacySession,
  type DeviceAccount,
} from "@/lib/device-accounts"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function NavUser({
  user,
  onChangePassword,
  onLogoutCurrent,
  onLogoutAll,
  onSwitchAccount,
  onRemoveAccount,
}: {
  user: {
    name: string
    email: string
    roleLabel: string
  }
  onChangePassword: () => void
  onLogoutCurrent: () => void
  onLogoutAll: () => void
  onSwitchAccount: (token: string) => void
  onRemoveAccount: (token: string, email: string) => void
}) {
  const { isMobile } = useSidebar()
  const initials = getInitials(user.name)
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<DeviceAccount[]>([])
  const [activeToken, setActiveToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const legacy = isLegacySession(activeToken, accounts)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void Promise.all([getDeviceAccounts(), getActiveSessionToken()])
      .then(([items, token]) => {
        if (cancelled) return
        setAccounts(items)
        setActiveToken(token)
        setError("")
      })
      .catch(() => {
        if (!cancelled) setError("Daftar akun tidak dapat dimuat.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (next) setLoading(true)
          }}
        >
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label="Buka menu profil"
                className="h-14 rounded-2xl border border-sidebar-border bg-white/80 shadow-sm group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none dark:bg-[#2d232e]/80 data-open:bg-sidebar-accent"
              />
            }
          >
            <Avatar size="lg">
              <AvatarFallback className="bg-gradient-to-br from-[#52082b] to-[#d00064] text-xs font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.roleLabel}
              </span>
            </div>
            <IconSelector className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-80"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-2 font-normal">
                <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2">
                  <Avatar size="lg">
                    <AvatarFallback className="bg-gradient-to-br from-[#52082b] to-[#d00064] text-xs font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-xs">{user.email}</span>
                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-[#9f004c] dark:bg-pink-900/40 dark:text-pink-200">
                      <IconShieldCheck className="size-3" />
                      {user.roleLabel}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Akun di browser ini</DropdownMenuLabel>
              {loading ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Memuat akun…
                </p>
              ) : null}
              {!loading && error ? (
                <p role="alert" className="px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              ) : null}
              {!loading && !error ? (
                <>
                  <div className="flex items-center gap-2 rounded-2xl bg-pink-50 px-3 py-2.5 dark:bg-pink-400/10">
                    <IconCheck className="size-4 shrink-0 text-pink-700 dark:text-pink-300" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {user.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </span>
                    <span className="text-[10px] font-semibold text-pink-700 dark:text-pink-300">
                      Aktif
                    </span>
                  </div>
                  {accounts
                    .filter(({ session }) => session.token !== activeToken)
                    .map(({ session, user: other }) => (
                      <div
                        key={session.id}
                        className="mt-1 flex items-stretch gap-1"
                      >
                        <DropdownMenuItem
                          className="min-w-0 flex-1"
                          onClick={() => onSwitchAccount(session.token)}
                        >
                          <span className="min-w-0">
                            <span className="block truncate">{other.name}</span>
                            <span className="block truncate text-xs font-normal text-muted-foreground">
                              {other.email}
                            </span>
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          aria-label={`Lepas akun ${other.email}`}
                          title={`Lepas akun ${other.email}`}
                          className="px-2 text-muted-foreground"
                          onClick={() =>
                            onRemoveAccount(session.token, other.email)
                          }
                        >
                          <IconTrash className="size-4" />
                        </DropdownMenuItem>
                      </div>
                    ))}
                  {legacy ? (
                    <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                      Masuk ulang ke akun ini sekali sebelum menambah akun lain.
                    </p>
                  ) : null}
                  {accounts.length >= MAX_DEVICE_ACCOUNTS && !legacy ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      Batas {MAX_DEVICE_ACCOUNTS} akun tercapai. Lepas satu akun
                      untuk menambah yang baru.
                    </p>
                  ) : (
                    <DropdownMenuItem
                      render={<Link href="/login/add-account" />}
                    >
                      <IconPlus />
                      {legacy ? "Aktifkan ganti akun" : "Tambah akun"}
                    </DropdownMenuItem>
                  )}
                </>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onChangePassword}>
                <IconKey />
                Ganti password
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/" />}>
                <IconHome />
                Beranda publik
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onLogoutCurrent}>
              <IconLogout />
              Keluar akun ini
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onLogoutAll}>
              <IconLogout />
              Keluar semua akun
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
