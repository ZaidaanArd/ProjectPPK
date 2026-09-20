"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { BrandLogo } from "@/components/brand-logo"
import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useConvexAuth, useQuery } from "convex/react"
import {
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconLoader2,
} from "@tabler/icons-react"

import { AuthVisualPanel } from "../auth-visual-panel"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "../../../../convex/_generated/api"
import { authClient } from "@/lib/auth-client"

export function LoginForm() {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const profile = useQuery(api.profiles.current, isAuthenticated ? {} : "skip")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading || !isAuthenticated || profile === undefined) return

    if (profile?.status === "active") {
      const destination =
        profile.role === "admin"
          ? "/admin"
          : profile.role === "officer"
            ? "/staff"
            : "/app"
      router.replace(destination)
      return
    }

    const message =
      profile?.status === "rejected"
        ? "Pendaftaran akun ditolak. Hubungi administrator."
        : profile?.status === "disabled"
          ? "Akun dinonaktifkan. Hubungi administrator."
          : "Akun masih menunggu verifikasi administrator."

    void authClient.signOut().finally(() => {
      setError(message)
      setLoading(false)
    })
  }, [isAuthenticated, loading, profile, router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      })

      if (!result.error) return
      setError("Email atau password tidak sesuai.")
      setLoading(false)
    } catch {
      setError("Tidak dapat terhubung. Silakan coba lagi.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh bg-background lg:h-svh lg:overflow-hidden">
      {/* Left — login panel */}
      <div className="login-form-panel relative z-10 flex flex-1 flex-col items-center overflow-y-auto px-8 pt-24 pb-12 lg:h-svh lg:max-w-[48%] lg:flex-none lg:basis-[48%] lg:rounded-r-2xl xl:basis-[44%]">
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:top-8 sm:left-8"
        >
          <IconArrowLeft size={17} aria-hidden="true" />
          Kembali
        </Link>

        <div className="my-auto w-full max-w-[380px] shrink-0">
          {/* Logo */}
          <div className="mb-10 flex flex-col items-center gap-3">
            <BrandLogo markOnly />
            <div className="text-center">
              <h1 className="font-heading text-[26px] font-semibold tracking-tight text-foreground">
                Selamat Datang di Sthana Kampus!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="rounded-lg border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <div>
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="rounded-lg border-border bg-background pr-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <IconEyeOff aria-hidden="true" />
                  ) : (
                    <IconEye aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember-me" className="text-sm font-normal">
                Ingat saya
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="login-pink-accent mt-1 w-full rounded-lg"
            >
              {loading ? (
                <>
                  <IconLoader2 className="animate-spin" aria-hidden="true" />
                  Masuk…
                </>
              ) : (
                "Masuk"
              )}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </form>

          {/* Footer */}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground transition-opacity hover:opacity-70"
            >
              Daftar
            </Link>
          </p>
        </div>
      </div>

      {/* Right — abstract image panel */}
      <AuthVisualPanel />
    </div>
  )
}
