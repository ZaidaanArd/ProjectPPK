import { StaffReports, type ReportTab } from "@/components/staff-portal"

function parseTab(value: string | string[] | undefined): ReportTab | undefined {
  const tab = Array.isArray(value) ? value[0] : value
  if (tab === "baru" || tab === "ditangani" || tab === "riwayat") return tab
  return undefined
}

export default async function ReportQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; item?: string | string[] }>
}) {
  const { tab, item } = await searchParams
  return (
    <StaffReports
      initialTab={parseTab(tab)}
      initialItem={Array.isArray(item) ? item[0] : item}
    />
  )
}
