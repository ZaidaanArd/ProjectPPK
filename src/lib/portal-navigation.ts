import {
  IconBuilding,
  IconCalendar,
  IconChartBar,
  IconClipboardCheck,
  IconFileAlert,
  IconHome,
  IconUsers,
} from "@tabler/icons-react"

export type PortalRole = "user" | "officer" | "admin"

export type PortalNavigationItem = {
  href: string
  label: string
  description: string
  icon: typeof IconHome
}

export const portalRoleMeta = {
  user: {
    label: "Pengguna",
    description: "Reservasi & laporan",
    home: "/app",
  },
  officer: {
    label: "Petugas",
    description: "Operasional fasilitas",
    home: "/staff",
  },
  admin: {
    label: "Admin",
    description: "Kontrol sistem",
    home: "/admin",
  },
} satisfies Record<
  PortalRole,
  { label: string; description: string; home: string }
>

export const portalNavigation = {
  user: [
    {
      href: "/app",
      label: "Beranda",
      description: "Ringkasan aktivitas",
      icon: IconHome,
    },
    {
      href: "/app/reservations",
      label: "Reservasi",
      description: "Jadwal penggunaan ruang",
      icon: IconCalendar,
    },
    {
      href: "/app/reports",
      label: "Laporan",
      description: "Kendala fasilitas",
      icon: IconFileAlert,
    },
  ],
  officer: [
    {
      href: "/staff",
      label: "Beranda",
      description: "Ringkasan antrean",
      icon: IconHome,
    },
    {
      href: "/staff/reservations",
      label: "Antrean reservasi",
      description: "Tinjau permohonan masuk",
      icon: IconClipboardCheck,
    },
    {
      href: "/staff/reports",
      label: "Laporan",
      description: "Tindak lanjut kendala",
      icon: IconFileAlert,
    },
  ],
  admin: [
    {
      href: "/admin",
      label: "Ringkasan",
      description: "Analitik sistem",
      icon: IconChartBar,
    },
    {
      href: "/admin/facilities",
      label: "Fasilitas",
      description: "Data dan status ruang",
      icon: IconBuilding,
    },
    {
      href: "/admin/users",
      label: "Akun",
      description: "Pengguna dan hak akses",
      icon: IconUsers,
    },
  ],
} satisfies Record<PortalRole, PortalNavigationItem[]>

export function getActivePortalItem(role: PortalRole, pathname: string) {
  const items = portalNavigation[role]
  const home = portalRoleMeta[role].home

  return (
    items.find(
      (item) =>
        pathname === item.href ||
        (item.href !== home && pathname.startsWith(item.href + "/"))
    ) ?? items[0]
  )
}
