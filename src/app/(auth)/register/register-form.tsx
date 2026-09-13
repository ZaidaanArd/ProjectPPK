"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import {
  IconArrowLeft,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
} from "@tabler/icons-react"

import { AuthVisualPanel } from "../auth-visual-panel"
import { Badge } from "@/components/ui/badge"
import { BrandLogo } from "@/components/brand-logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function Field({
  label,
  htmlFor,
  description,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  description?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PasswordToggle({
  show,
  onToggle,
  label,
}: {
  show: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onToggle}
      aria-label={label}
      className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
    >
      {show ? (
        <IconEyeOff aria-hidden="true" />
      ) : (
        <IconEye aria-hidden="true" />
      )}
    </Button>
  )
}

const userTypes = [
  {
    value: "mahasiswa",
    label: "Mahasiswa",
    desc: "Saya adalah mahasiswa aktif",
  },
  {
    value: "dosen",
    label: "Dosen",
    desc: "Saya adalah tenaga pengajar",
  },
] as const

export function RegisterForm() {
  const [nama, setNama] = useState("")
  const [nomorInduk, setNomorInduk] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [konfirmasi, setKonfirmasi] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [showKonfirmasi, setShowKonfirmasi] = useState(false)
  const [tipe, setTipe] = useState<string>("mahasiswa")
  const [submitted, setSubmitted] = useState(false)

  const passwordTooShort = password.length > 0 && password.length < 8
  const passwordMismatch = konfirmasi.length > 0 && password !== konfirmasi
  const canSubmit =
    nama.length > 0 &&
    nomorInduk.length > 0 &&
    email.length > 0 &&
    password.length >= 8 &&
    konfirmasi.length > 0 &&
    !passwordMismatch

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (passwordMismatch) return
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-svh bg-background lg:h-svh lg:overflow-hidden">
      {/* Left — register panel */}
      <div className="login-form-panel relative z-10 flex flex-1 flex-col items-center overflow-y-auto px-8 pt-24 pb-12 lg:h-svh lg:max-w-[48%] lg:flex-none lg:basis-[48%] lg:rounded-r-2xl xl:basis-[44%]">
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:top-8 sm:left-8"
        >
          <IconArrowLeft size={17} aria-hidden="true" />
          Kembali
        </Link>

        <div className="my-auto w-full max-w-[380px] shrink-0">
          {/* Header */}
          <div className="mb-10 flex flex-col items-center gap-3">
            <BrandLogo markOnly />
            <div className="text-center">
              <h1 className="font-heading text-[26px] font-semibold tracking-tight text-foreground">
                Buat Akun Sthana Kampus!
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Daftar untuk mulai menggunakan layanan
              </p>
            </div>
          </div>

          {submitted ? (
            /* Success state */
            <Card className="items-center gap-4 rounded-2xl p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                <IconCheck className="size-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-foreground">
                  Pendaftaran Berhasil!
                </p>
                <p className="text-sm text-muted-foreground">
                  Akun Anda sedang menunggu verifikasi dari admin. Kami akan
                  mengirimkan konfirmasi ke email kampus Anda.
                </p>
              </div>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "rounded-lg border"
                )}
              >
                Kembali ke Login
              </Link>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Tipe pengguna */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-foreground">
                  Tipe Pengguna
                </p>
                <RadioGroup value={tipe} onValueChange={setTipe}>
                  {userTypes.map((opt) => (
                    <div key={opt.value} className="flex items-start gap-3">
                      <RadioGroupItem
                        value={opt.value}
                        id={`tipe-${opt.value}`}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`tipe-${opt.value}`}
                        className="flex-col items-start gap-0.5 font-normal"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {opt.label}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {opt.desc}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Divider */}
              <Separator />

              {/* Form fields */}
              <div className="flex flex-col gap-3">
                <Field label="Nama Lengkap" htmlFor="nama">
                  <Input
                    id="nama"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    autoComplete="name"
                    className="rounded-lg border-border bg-background"
                  />
                </Field>

                <Field
                  label={tipe === "mahasiswa" ? "NIM" : "NIP"}
                  htmlFor="nomor-induk"
                >
                  <Input
                    id="nomor-induk"
                    type="text"
                    placeholder={
                      tipe === "mahasiswa"
                        ? "Masukkan NIM Anda"
                        : "Masukkan NIP Anda"
                    }
                    value={nomorInduk}
                    onChange={(e) => setNomorInduk(e.target.value)}
                    required
                    className="rounded-lg border-border bg-background"
                  />
                </Field>

                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="rounded-lg border-border bg-background"
                  />
                </Field>

                <Field
                  label="Password"
                  htmlFor="password"
                  error={
                    passwordTooShort ? "Password minimal 8 karakter" : undefined
                  }
                >
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="rounded-lg border-border bg-background pr-9"
                    />
                    <PasswordToggle
                      show={showPass}
                      onToggle={() => setShowPass(!showPass)}
                      label={
                        showPass ? "Sembunyikan password" : "Tampilkan password"
                      }
                    />
                  </div>
                </Field>

                <Field
                  label="Konfirmasi Password"
                  htmlFor="konfirmasi-password"
                  error={passwordMismatch ? "Password tidak cocok" : undefined}
                >
                  <div className="relative">
                    <Input
                      id="konfirmasi-password"
                      type={showKonfirmasi ? "text" : "password"}
                      placeholder="Ulangi password Anda"
                      value={konfirmasi}
                      onChange={(e) => setKonfirmasi(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="rounded-lg border-border bg-background pr-9"
                    />
                    <PasswordToggle
                      show={showKonfirmasi}
                      onToggle={() => setShowKonfirmasi(!showKonfirmasi)}
                      label={
                        showKonfirmasi
                          ? "Sembunyikan konfirmasi password"
                          : "Tampilkan konfirmasi password"
                      }
                    />
                  </div>
                </Field>
              </div>

              {/* Verification notice */}
              <div className="flex items-start gap-3 rounded-xl border bg-muted p-4">
                <IconInfoCircle
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-foreground">
                    Verifikasi Akun Diperlukan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Setelah mendaftar, akun Anda akan menunggu verifikasi dari
                    administrator. Proses ini biasanya memakan waktu 1–2 hari
                    kerja.
                  </p>
                  <Badge variant="secondary" className="self-start">
                    Pending Verifikasi
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="login-pink-accent w-full rounded-lg"
                >
                  Daftar Sekarang
                </Button>
              </div>
            </form>
          )}

          {/* Footer */}
          {!submitted && (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground transition-opacity hover:opacity-70"
              >
                Masuk
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right — abstract panel */}
      <AuthVisualPanel />
    </div>
  )
}
