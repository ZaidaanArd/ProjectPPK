import { StaffReports, type ReportTab } from "@/components/staff-portal"

function parseTab(value: string | string[] | undefined): ReportTab | undefined {
  const tab = Array.isArray(value) ? value[0] : value
  if (tab === "baru" || tab === "ditangani" || tab === "riwayat") return tab
  return undefined
}

export default async function ReportQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const { tab } = await searchParams
  return <StaffReports initialTab={parseTab(tab)} />
}
