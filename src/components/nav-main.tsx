"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { PortalNavigationItem } from "@/lib/portal-navigation"

export function NavMain({ items }: { items: PortalNavigationItem[] }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu utama</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-2">
          {items.map((item, index) => {
            const isHome = index === 0
            const active =
              pathname === item.href ||
              (!isHome && pathname.startsWith(item.href + "/"))

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  size="lg"
                  className="mx-1.5 h-10 w-[calc(100%-0.75rem)] rounded-2xl px-3 group-data-[collapsible=icon]:rounded-xl data-active:bg-[#d00064] data-active:text-white data-active:shadow-[0_6px_14px_rgba(208,0,100,0.14)] group-data-[collapsible=icon]:data-active:shadow-none data-active:hover:bg-[#b80058] data-active:hover:text-white"
                  render={
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      onClick={() => setOpenMobile(false)}
                    />
                  }
                >
                  <item.icon className="size-[18px]" aria-hidden="true" />
                  <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{item.label}</span>
                    <span className="truncate text-[10px] opacity-65">
                      {item.description}
                    </span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
