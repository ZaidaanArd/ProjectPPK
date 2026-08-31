"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { registerInputSchema, type RegisterInput } from "@workspace/contracts"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { useState } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"

import { FormField } from "@/components/form-field"

export function Component() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerInputSchema) })

  return (
    <div className="page-enter w-full">
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-primary uppercase">
        Registrasi mandiri
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.045em]">
        Mulai dengan identitas kampusmu.
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Akun baru berstatus menunggu sampai diverifikasi admin.
      </p>
      <Card className="mt-7 shadow-lg">
        <CardContent className="p-6">
          <form
            className="grid gap-4"
            onSubmit={handleSubmit(() => setSubmitted(true))}
            noValidate
          >
            <FormField
              label="Nama lengkap"
              htmlFor="name"
              error={errors.name?.message}
            >
              <Input id="name" autoComplete="name" {...register("name")} />
            </FormField>
            <FormField
              label="Email kampus"
              htmlFor="register-email"
              error={errors.email?.message}
            >
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
            </FormField>
            <FormField
              label="Kata sandi"
              htmlFor="register-password"
              error={errors.password?.message}
            >
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
            </FormField>
            <FormField
              label="Konfirmasi kata sandi"
              htmlFor="password-confirmation"
              error={errors.passwordConfirmation?.message}
            >
              <Input
                id="password-confirmation"
                type="password"
                autoComplete="new-password"
                {...register("passwordConfirmation")}
              />
            </FormField>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              Kirim registrasi
            </Button>
            {submitted ? (
              <p className="rounded-2xl bg-emerald-50 p-3 text-xs leading-5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                Form valid. Pengiriman ke antrean verifikasi akan diaktifkan
                pada milestone autentikasi.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah terdaftar?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  )
}
