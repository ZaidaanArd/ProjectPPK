import { AdminUsers } from "@/components/admin-portal"

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>
}) {
  const { status } = await searchParams
  const selected =
    typeof status === "string" &&
    ["pending", "active", "disabled", "rejected"].includes(status)
      ? status
      : "all"
  return <AdminUsers key={selected} initialStatus={selected} />
}
