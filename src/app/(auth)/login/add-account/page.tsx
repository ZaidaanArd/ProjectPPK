import type { Metadata } from "next"

import { LoginForm } from "../login-form"

export const metadata: Metadata = { title: "Tambah akun" }

export default function AddAccountPage() {
  return <LoginForm addAccount />
}
