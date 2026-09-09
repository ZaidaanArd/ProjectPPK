"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  IconArrowLeft,
  IconBuilding,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconFileDescription,
  IconLoader2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

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

const carouselSlides = [
  {
    title: "Temukan ruang yang tersedia",
    description: "Cek fasilitas dan jadwalnya sebelum mengajukan reservasi.",
    icon: IconBuilding,
  },
  {
    title: "Reservasi tanpa bentrok jadwal",
    description: "Pilih waktu penggunaan dalam slot 30 menit yang tersedia.",
    icon: IconCalendarEvent,
  },
  {
    title: "Laporkan fasilitas bermasalah",
    description:
      "Kirim laporan dan pantau status penanganannya dari satu tempat.",
    icon: IconFileDescription,
  },
] as const

const reservationSlots = Array.from({ length: 12 }, (_, index) => index)

function FeaturePreview({ index }: { index: number }) {
  if (index === 1) {
    return (
      <div className="grid h-full grid-cols-4 gap-3 p-6">
        {reservationSlots.map((slot) => (
          <div
            key={slot}
            className={
              [2, 3, 6, 10].includes(slot)
                ? "rounded-xl border border-white/15 bg-white/8"
                : "rounded-xl border border-white/25 bg-white/20"
            }
          />
        ))}
        <div className="absolute right-8 bottom-8 left-8 rounded-2xl bg-white px-5 py-4 text-[#65002d] shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#65002d]/55">Slot dipilih</p>
              <p className="mt-0.5 font-semibold">09.00 – 09.30</p>
            </div>
            <IconCalendarEvent size={22} aria-hidden="true" />
          </div>
        </div>
      </div>
    )
  }

  if (index === 2) {
    return (
      <div className="flex h-full flex-col justify-center px-9">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-[#80003d]">
            <IconFileDescription size={26} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-white/55">Proyektor · Ruang Seminar</p>
            <p className="mt-1 text-lg font-semibold">Sedang ditangani</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["Dilaporkan", "Diproses", "Selesai"].map((label, step) => (
            <div key={label}>
              <div
                className={
                  step < 2
                    ? "h-2 rounded-full bg-white"
                    : "h-2 rounded-full bg-white/16"
                }
              />
              <p className="mt-2 text-xs text-white/55">{label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-[1.25fr_0.75fr] gap-4 p-6">
      <div className="grid grid-cols-2 grid-rows-3 gap-3">
        <div className="col-span-2 rounded-2xl border border-white/18 bg-white/16" />
        <div className="rounded-2xl border border-white/18 bg-white/10" />
        <div className="rounded-2xl border border-white/25 bg-white/25" />
        <div className="col-span-2 rounded-2xl border border-white/18 bg-white/12" />
      </div>
      <div className="flex flex-col justify-end rounded-2xl bg-white p-5 text-[#65002d] shadow-xl">
        <IconBuilding size={24} aria-hidden="true" />
        <p className="mt-auto text-xs text-[#65002d]/55">Tersedia sekarang</p>
        <p className="mt-1 leading-tight font-semibold">Lab Komputer A</p>
      </div>
    </div>
  )
}

function AbstractPanel() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselSlides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  const slide = carouselSlides[activeSlide]
  const SlideIcon = slide.icon

  function showPrevious() {
    setActiveSlide(
      (current) => (current - 1 + carouselSlides.length) % carouselSlides.length
    )
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % carouselSlides.length)
  }

  return (
    <aside className="login-gradient-flow relative hidden h-full flex-1 overflow-hidden bg-[linear-gradient(145deg,#d00064_0%,#82003e_50%,#43001c_100%)] text-white lg:flex">
      <div
        className="login-gradient-drift absolute -right-32 -bottom-32 size-[620px] rounded-full bg-pink-300/25 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full flex-col px-12 py-10 xl:px-16 xl:py-12 2xl:px-24">
        {/* <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
            <LogoIcon />
          </div>
          <span className="font-heading text-sm font-semibold">
            RuangKampus
          </span>
        </div> */}

        <div className="my-auto w-full max-w-[560px] self-center">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-white/16 bg-black/12 shadow-[0_30px_90px_rgba(39,0,18,0.3)] backdrop-blur-xl">
            <div
              key={activeSlide}
              className="login-carousel-enter absolute inset-0"
            >
              <FeaturePreview index={activeSlide} />
            </div>
          </div>

          <div className="mt-7 flex items-end justify-between gap-8">
            <div className="max-w-sm" aria-live="polite">
              <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-white/14">
                <SlideIcon size={19} aria-hidden="true" />
              </div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight xl:text-3xl">
                {slide.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {slide.description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={showPrevious}
                aria-label="Fitur sebelumnya"
                className="rounded-full border border-white/15 text-white hover:bg-white/12 hover:text-white"
              >
                <IconChevronLeft aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={showNext}
                aria-label="Fitur berikutnya"
                className="rounded-full border border-white/15 text-white hover:bg-white/12 hover:text-white"
              >
                <IconChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="mt-7 flex gap-2" aria-label="Pilih fitur">
            {carouselSlides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveSlide(index)}
                aria-label={
                  "Tampilkan fitur " + (index + 1) + ": " + item.title
                }
                aria-current={index === activeSlide ? "true" : undefined}
                className={
                  index === activeSlide
                    ? "h-1 w-10 rounded-full bg-white transition-all duration-300"
                    : "h-1 w-5 rounded-full bg-white/25 transition-all duration-300"
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute inset-y-0 left-0 w-8 -translate-x-1/2 rounded-full bg-background" />
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
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-12 lg:h-svh lg:max-w-[48%] lg:flex-none lg:basis-[48%] xl:basis-[44%]">
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:top-8 sm:left-8"
        >
          <IconArrowLeft size={17} aria-hidden="true" />
          Kembali
        </Link>

        <div className="w-full max-w-[380px]">
          {/* Logo */}
          <div className="mb-10 flex flex-col items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
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
              className="mt-1 w-full rounded-lg"
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
