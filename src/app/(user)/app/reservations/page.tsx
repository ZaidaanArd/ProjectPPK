import { ReservationList } from "@/components/user-portal"

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>
}) {
  const { item } = await searchParams
  return <ReservationList initialItem={item} />
}
