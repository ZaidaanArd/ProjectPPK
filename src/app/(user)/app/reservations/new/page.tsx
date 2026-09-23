import { ReservationForm } from "@/components/user-portal"

type SearchParams = {
  facility?: string | string[]
  date?: string | string[]
}

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { facility, date } = await searchParams
  const initialFacilityId = typeof facility === "string" ? facility : undefined
  const initialDate =
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00+07:00`))
      ? date
      : undefined

  return (
    <ReservationForm
      initialFacilityId={initialFacilityId}
      initialDate={initialDate}
    />
  )
}
