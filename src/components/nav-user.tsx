"use client"

import Link from "next/link"
import {
  IconHome,
  IconKey,
  IconLogout,
  IconSelector,
  IconShieldCheck,
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
  onLogout,
}: {
  user: {
    name: string
    email: string
    roleLabel: string
  }
  onChangePassword: () => void
  onLogout: () => void
}) {
  const { isMobile } = useSidebar()
  const initials = getInitials(user.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
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
            className="w-72"
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
            <DropdownMenuItem variant="destructive" onClick={onLogout}>
              <IconLogout />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
