export type PortalAccount = {
  role: "user" | "officer" | "admin"
  status: "pending" | "active" | "rejected" | "disabled"
}

export const MAX_DEVICE_ACCOUNTS = 5

export function accountDestination(profile: PortalAccount | null) {
  if (!profile || profile.status !== "active") return "/account/status"

  if (profile.role === "admin") return "/admin"
  if (profile.role === "officer") return "/staff"
  return "/app"
}

export function accountStatusMessage(status: PortalAccount["status"] | null) {
  if (status === "pending")
    return "Akun ini masih menunggu verifikasi administrator."
  if (status === "rejected")
    return "Pendaftaran akun ini ditolak. Hubungi administrator."
  if (status === "disabled")
    return "Akun ini dinonaktifkan. Hubungi administrator."
  return "Profil akun belum tersedia. Coba lagi atau hubungi administrator."
}
