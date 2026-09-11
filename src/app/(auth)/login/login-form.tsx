"use client"

import Link from "next/link"
import { useState } from "react"
import type { FormEvent } from "react"
import {
  IconArrowLeft,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from "@tabler/icons-react"

import { LoginFeatureCarousel } from "./login-feature-carousel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { LiveOrb } from "@/components/ui/live-orb"

function LogoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function SsoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="#003479" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        SSO
      </text>
    </svg>
  )
}

const liveOrbColors = ["#f062aa", "#fff5fa", "#ffacd5"]

function AbstractPanel() {
  const [showInfo, setShowInfo] = useState(false)
  const [introConsumed, setIntroConsumed] = useState(false)

  return (
    <aside className="login-gradient-flow relative hidden h-full flex-1 items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#d00064_0%,#82003e_50%,#43001c_100%)] text-white lg:flex">
      <div
        className="login-gradient-drift absolute -right-32 -bottom-32 size-[620px] rounded-full bg-pink-300/25 blur-[100px]"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => {
          setIntroConsumed(true)
          setShowInfo((current) => !current)
        }}
        aria-label={showInfo ? "Kembali ke orb" : "Lihat fitur RuangKampus"}
        aria-pressed={showInfo}
        title={showInfo ? "Kembali ke orb" : "Lihat fitur"}
        className="absolute top-7 right-7 z-20 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/10 text-white/75 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        {showInfo ? (
          <IconX size={17} aria-hidden="true" />
        ) : (
          <IconInfoCircle size={18} aria-hidden="true" />
        )}
      </button>

      <div
        key={showInfo ? "carousel" : "orb"}
        className="login-panel-swap relative z-10 flex size-full items-center justify-center"
      >
        {showInfo ? (
          <LoginFeatureCarousel />
        ) : (
          <div className="login-orb-scene" data-intro={!introConsumed}>
            <div className="login-orb-halo" aria-hidden="true" />
            <div className="login-orb-entrance">
              <div className="login-orb-float">
                <LiveOrb
                  size={360}
                  variant="webgl"
                  appearance="luminous"
                  colors={liveOrbColors}
                />
              </div>
            </div>
            <div className="login-orb-shadow" aria-hidden="true">
              <div />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
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
            <div className="login-pink-accent flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LogoIcon />
            </div>
            <div className="text-center">
              <h1 className="font-heading text-[26px] font-semibold tracking-tight text-foreground">
                Selamat Datang di RuangKampus!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>
          </div>

          {/* Social buttons */}
          <div className="mb-5 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 rounded-lg border border-border"
            >
              <GoogleIcon />
              Google
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 rounded-lg border border-border"
            >
              <SsoIcon />
              SSO Undip
            </Button>
          </div>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground">
              ATAU
            </span>
            <Separator className="flex-1" />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-xs text-muted-foreground transition-opacity hover:opacity-70"
                >
                  Lupa password?
                </a>
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
          </form>

          {/* Footer */}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <a
              href="/register"
              className="font-medium text-foreground transition-opacity hover:opacity-70"
            >
              Daftar
            </a>
          </p>
        </div>
      </div>

      {/* Right — abstract image panel */}
      <AbstractPanel />
    </div>
  )
}
