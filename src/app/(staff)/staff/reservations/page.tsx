import {
  StaffReservations,
  type ReservationTab,
} from "@/components/staff-portal"

function parseTab(
  value: string | string[] | undefined
): ReservationTab | undefined {
  const tab = Array.isArray(value) ? value[0] : value
  if (tab === "menunggu" || tab === "disetujui" || tab === "riwayat") {
    return tab
  }
  return undefined
}

export default async function ReservationQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; item?: string | string[] }>
}) {
  const { tab, item } = await searchParams
  return (
    <StaffReservations
      initialTab={parseTab(tab)}
      initialItem={Array.isArray(item) ? item[0] : item}
    />
  )
}
