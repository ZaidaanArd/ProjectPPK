import type { Metadata } from "next"

import { Component as LoginView } from "@/views/auth/login-view"

export const metadata: Metadata = { title: "Masuk" }

export default function LoginPage() {
  return <LoginView />
}
