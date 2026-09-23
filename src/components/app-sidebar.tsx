"use client"

import Image from "next/image"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  portalNavigation,
  portalRoleMeta,
  type PortalRole,
} from "@/lib/portal-navigation"

export function AppSidebar({
  profile,
  onChangePassword,
  onLogoutCurrent,
  onLogoutAll,
  onSwitchAccount,
  onRemoveAccount,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  profile: {
    name: string
    email: string
    role: PortalRole
  }
  onChangePassword: () => void
  onLogoutCurrent: () => void
  onLogoutAll: () => void
  onSwitchAccount: (token: string) => void
  onRemoveAccount: (token: string, email: string) => void
}) {
  const role = portalRoleMeta[profile.role]

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader className="pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-14 rounded-2xl group-data-[collapsible=icon]:rounded-xl data-open:bg-sidebar-accent"
              render={<Link href={role.home} aria-label="Sthana Kampus" />}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-pink-950/5 dark:bg-[#34212b] dark:ring-white/10">
                <Image
                  src="/brand/sthana-mark-128.png"
                  alt=""
                  width={34}
                  height={34}
                  priority
                />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-heading text-sm font-bold text-[#52082b] dark:text-pink-100">
                  Sthana Kampus
                </span>
                <span className="truncate text-[10px] text-[#9f004c] dark:text-pink-300">
                  {role.description}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={portalNavigation[profile.role]} />
      </SidebarContent>

      <SidebarFooter className="pb-3">
        <NavUser
          user={{
            name: profile.name,
            email: profile.email,
            roleLabel: role.label,
          }}
          onChangePassword={onChangePassword}
          onLogoutCurrent={onLogoutCurrent}
          onLogoutAll={onLogoutAll}
          onSwitchAccount={onSwitchAccount}
          onRemoveAccount={onRemoveAccount}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
