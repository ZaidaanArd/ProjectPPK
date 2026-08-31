import { zodResolver } from "@hookform/resolvers/zod"
import { loginInputSchema, type LoginInput } from "@workspace/contracts"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"

import { FormField } from "@/components/form-field"

export function Component() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginInputSchema) })

  const onSubmit = () => {
    setSubmitted(true)
  }

  return (
    <div className="page-enter w-full">
      <p className="font-mono text-xs font-bold tracking-[0.18em] text-primary uppercase">
        Selamat datang
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.045em]">
        Masuk ke portal kampus.
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Gunakan akun yang sudah diverifikasi oleh admin.
      </p>

      <Card className="mt-7 shadow-lg">
        <CardContent className="p-6">
          <form
            className="grid gap-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <FormField
              label="Email kampus"
              htmlFor="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@kampus.ac.id"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </FormField>
            <FormField
              label="Kata sandi"
              htmlFor="password"
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
            </FormField>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              Masuk
            </Button>
            {submitted ? (
              <p className="rounded-2xl bg-amber-50 p-3 text-xs leading-5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Validasi client berhasil. Endpoint login akan dihubungkan pada
                milestone autentikasi.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link to="/register" className="font-bold text-primary hover:underline">
          Daftar mandiri
        </Link>
      </p>
    </div>
  )
}
