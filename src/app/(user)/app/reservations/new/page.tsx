import { ReservationForm } from "@/components/user-portal"

type SearchParams = {
  facility?: string | string[]
  date?: string | string[]
  slot?: string | string[]
}

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { facility, date, slot } = await searchParams
  const initialFacilityId = typeof facility === "string" ? facility : undefined
  const initialDate =
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00+07:00`))
      ? date
      : undefined
  const validSlot =
    typeof slot === "string" && /^\d{2}:(?:00|30)-\d{2}:(?:00|30)$/.test(slot)
  const [initialStartTime, initialEndTime] = validSlot ? slot.split("-") : []
  const startMinutes = initialStartTime
    ? Number(initialStartTime.slice(0, 2)) * 60 +
      Number(initialStartTime.slice(3))
    : 0
  const endMinutes = initialEndTime
    ? Number(initialEndTime.slice(0, 2)) * 60 + Number(initialEndTime.slice(3))
    : 0
  const validInterval =
    endMinutes - startMinutes === 30 &&
    startMinutes >= 420 &&
    endMinutes <= 1200

  return (
    <ReservationForm
      initialFacilityId={initialFacilityId}
      initialDate={initialDate}
      initialStartTime={validInterval ? initialStartTime : undefined}
      initialEndTime={validInterval ? initialEndTime : undefined}
    />
  )
}
