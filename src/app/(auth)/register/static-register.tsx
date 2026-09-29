"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/errors"
import { createStaticRegistration, hydrateStaticData } from "@/lib/static-data"

export function StaticRegister() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [done, setDone] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await hydrateStaticData()
      createStaticRegistration({ name, email })
      setDone(true)
      setMessage(
        "Pendaftaran demo tersimpan. Masuk sebagai Admin untuk meninjaunya."
      )
      toast.success("Pendaftaran demo tersimpan", {
        description: "Masuk sebagai Admin untuk meninjaunya.",
      })
    } catch (error) {
      const message = getErrorMessage(error, "Pendaftaran demo gagal")
      setMessage(message)
      toast.error("Pendaftaran demo gagal", { description: message })
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <BrandLogo />
        <div>
          <h1 className="font-heading text-2xl font-bold">Pendaftaran Demo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Akun ini hanya contoh lokal. Tidak ada password atau data yang
            dikirim ke server.
          </p>
        </div>
        {!done && (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="demo-name">Nama</Label>
              <Input
                id="demo-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-email">Email</Label>
              <Input
                id="demo-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Daftar demo
            </Button>
          </form>
        )}
        {message && <output className="block text-sm">{message}</output>}
        <Link
          href="/login"
          className="block text-center text-sm font-medium hover:underline"
        >
          Kembali ke pilihan peran
        </Link>
      </div>
    </main>
  )
}
