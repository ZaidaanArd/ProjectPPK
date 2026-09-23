"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  IconCheck,
  IconHome,
  IconKey,
  IconLogout,
  IconMoonStars,
  IconPlus,
  IconSelector,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark")
  try {
    localStorage.setItem("theme", dark ? "dark" : "light")
  } catch {
    // Keep the current theme usable when storage is unavailable.
  }
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
                className="h-14 rounded-2xl border border-sidebar-border bg-white/80 shadow-sm group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none hover:bg-pink-50 dark:bg-[#2d232e]/80 dark:hover:bg-pink-400/10 data-open:bg-pink-50 dark:data-open:bg-pink-400/10"
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
                {user.email}
              </span>
            </div>
            <IconSelector className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 border border-pink-950/10 bg-white/95 p-2 shadow-xl dark:border-pink-200/10 dark:bg-[#2b222d]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <div className="p-2">
              <div className="flex items-center gap-3 rounded-2xl bg-pink-50/80 p-2.5 dark:bg-pink-400/10">
                <Avatar size="lg">
                  <AvatarFallback className="bg-gradient-to-br from-[#52082b] to-[#d00064] text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <span className="sr-only">Peran: {user.roleLabel}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="focus:bg-pink-50 data-popup-open:bg-pink-50 dark:focus:bg-pink-400/10 dark:data-popup-open:bg-pink-400/10">
                <IconUsers className="size-4" />
                Ganti akun
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                side={isMobile ? "top" : "right"}
                className="w-80 border border-pink-950/10 bg-white/95 p-2 shadow-xl dark:border-pink-200/10 dark:bg-[#2b222d]"
              >
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Akun di browser ini
                </p>
                <div className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2.5 dark:bg-pink-400/10">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-gradient-to-br from-[#52082b] to-[#d00064] text-[10px] font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {user.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                  <IconCheck
                    className="size-4 shrink-0 text-pink-700 dark:text-pink-300"
                    aria-label="Akun aktif"
                  />
                </div>
                {loading ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Memuat akun…
                  </p>
                ) : null}
                {!loading && error ? (
                  <p
                    role="alert"
                    className="px-3 py-2 text-xs text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
                {!loading && !error ? (
                  <>
                    {accounts
                      .filter(({ session }) => session.token !== activeToken)
                      .map(({ session, user: other }) => (
                        <DropdownMenuItem
                          key={session.id}
                          className="mt-1 focus:bg-pink-50 dark:focus:bg-pink-400/10"
                          onClick={() => onSwitchAccount(session.token)}
                        >
                          <Avatar size="sm">
                            <AvatarFallback className="bg-pink-100 text-[10px] font-semibold text-pink-900 dark:bg-pink-400/20 dark:text-pink-100">
                              {getInitials(other.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{other.name}</span>
                            <span className="block truncate text-xs font-normal text-muted-foreground">
                              {other.email}
                            </span>
                          </span>
                        </DropdownMenuItem>
                      ))}
                    {legacy ? (
                      <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        Masuk ulang sekali untuk mengaktifkan ganti akun.
                      </p>
                    ) : null}
                    <DropdownMenuSeparator />
                    {accounts.length >= MAX_DEVICE_ACCOUNTS ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        Maksimal {MAX_DEVICE_ACCOUNTS} akun. Lepas satu akun
                        dahulu.
                      </p>
                    ) : (
                      <DropdownMenuItem
                        render={<Link href="/login/add-account" />}
                        className="focus:bg-pink-50 dark:focus:bg-pink-400/10"
                      >
                        <IconPlus />
                        {legacy ? "Aktifkan ganti akun" : "Tambah akun"}
                      </DropdownMenuItem>
                    )}
                  </>
                ) : null}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="focus:bg-pink-50 data-popup-open:bg-pink-50 dark:focus:bg-pink-400/10 dark:data-popup-open:bg-pink-400/10">
                <IconSettings className="size-4" />
                Pengaturan
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                side={isMobile ? "top" : "right"}
                className="w-56 border border-pink-950/10 bg-white/95 p-2 shadow-xl dark:border-pink-200/10 dark:bg-[#2b222d]"
              >
                <DropdownMenuItem
                  onClick={onChangePassword}
                  className="focus:bg-pink-50 dark:focus:bg-pink-400/10"
                >
                  <IconKey />
                  Ganti password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="focus:bg-pink-50 dark:focus:bg-pink-400/10"
                >
                  <IconMoonStars />
                  Ganti tema
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              render={<Link href="/" />}
              className="focus:bg-pink-50 dark:focus:bg-pink-400/10"
            >
              <IconHome />
              Beranda publik
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-destructive focus:bg-rose-50 focus:text-destructive data-popup-open:bg-rose-50 dark:focus:bg-rose-400/10 dark:data-popup-open:bg-rose-400/10">
                <IconLogout className="size-4" />
                Keluar
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                side={isMobile ? "top" : "right"}
                className="w-80 border border-pink-950/10 bg-white/95 p-2 shadow-xl dark:border-pink-200/10 dark:bg-[#2b222d]"
              >
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onLogoutCurrent}
                >
                  <IconLogout />
                  Keluar dari {user.email}
                </DropdownMenuItem>
                {!loading && !error
                  ? accounts
                      .filter(({ session }) => session.token !== activeToken)
                      .map(({ session, user: other }) => (
                        <DropdownMenuItem
                          key={session.id}
                          variant="destructive"
                          onClick={() =>
                            onRemoveAccount(session.token, other.email)
                          }
                        >
                          <IconLogout />
                          <span className="truncate">
                            Keluar dari {other.email}
                          </span>
                        </DropdownMenuItem>
                      ))
                  : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onLogoutAll}>
                  <IconLogout />
                  Keluar semua akun
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
