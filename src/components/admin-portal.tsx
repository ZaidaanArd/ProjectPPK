"use client"

import Link from "next/link"
import { useState, type FormEvent, type ReactNode } from "react"
import { useMutation, useQuery } from "convex/react"
import { IconDownload, IconPlus } from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  active: "Aktif",
  rejected: "Ditolak",
  disabled: "Nonaktif",
  maintenance: "Perawatan",
  inactive: "Disembunyikan",
}

export function AdminDashboard() {
  const analytics = useQuery(api.admin.analytics)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Ringkasan sistem</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Data reservasi, laporan, dan penggunaan fasilitas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/api/admin/export?kind=reservations"
            prefetch={false}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconDownload aria-hidden="true" /> Reservasi CSV
          </Link>
          <Link
            href="/api/admin/export?kind=reports"
            prefetch={false}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <IconDownload aria-hidden="true" /> Laporan CSV
          </Link>
        </div>
      </div>
      {!analytics ? (
        <p className="text-sm text-muted-foreground">Memuat ringkasan…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Akun", analytics.accounts],
              ["Fasilitas", analytics.facilities],
              ["Reservasi", analytics.reservations],
              ["Laporan", analytics.reports],
            ].map(([label, value]) => (
              <Card key={label} className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold">{value}</p>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-semibold">Status reservasi</h2>
              <div className="mt-4 space-y-2">
                {analytics.reservationsByStatus.map((item) => (
                  <div
                    key={item.status}
                    className="flex justify-between text-sm"
                  >
                    <span className="capitalize">
                      {item.status.replace("_", " ")}
                    </span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Penggunaan fasilitas</h2>
              <div className="mt-4 space-y-3">
                {analytics.facilityUsage.slice(0, 8).map((item) => (
                  <div
                    key={item.facilityId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {item.approvedReservations} reservasi /{" "}
                      {Math.round(item.reservedMinutes / 60)} jam ·{" "}
                      {item.reports} laporan
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

type FacilityDraft = {
  id?: Id<"facilities">
  name: string
  type: string
  location: string
  capacity: string
  description: string
}

const emptyFacility: FacilityDraft = {
  name: "",
  type: "",
  location: "",
  capacity: "",
  description: "",
}

export function AdminFacilities() {
  const facilities = useQuery(api.facilities.listManaged)
  const createFacility = useMutation(api.facilities.create)
  const updateFacility = useMutation(api.facilities.update)
  const setStatus = useMutation(api.facilities.setStatus)
  const [draft, setDraft] = useState<FacilityDraft | null>(null)
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft) return
    setMessage("")
    const values = {
      name: draft.name,
      type: draft.type,
      location: draft.location,
      capacity: Number(draft.capacity),
      description: draft.description,
    }
    try {
      if (draft.id) await updateFacility({ facilityId: draft.id, ...values })
      else await createFacility(values)
      setDraft(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Penyimpanan gagal")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Kelola fasilitas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambah, ubah, dan atur visibilitas fasilitas.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyFacility })}>
          <IconPlus aria-hidden="true" /> Tambah fasilitas
        </Button>
      </div>

      {draft && (
        <Card className="p-6">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama" id="facility-name">
              <Input
                id="facility-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Tipe" id="facility-type">
              <Input
                id="facility-type"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                required
              />
            </Field>
            <Field label="Lokasi" id="facility-location">
              <Input
                id="facility-location"
                value={draft.location}
                onChange={(e) =>
                  setDraft({ ...draft, location: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Kapasitas" id="facility-capacity">
              <Input
                id="facility-capacity"
                type="number"
                min="1"
                value={draft.capacity}
                onChange={(e) =>
                  setDraft({ ...draft, capacity: e.target.value })
                }
                required
              />
            </Field>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="facility-description">Deskripsi</Label>
              <Textarea
                id="facility-description"
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                required
              />
            </div>
            {message && (
              <p className="text-sm text-destructive sm:col-span-2">
                {message}
              </p>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Simpan</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraft(null)}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!facilities ? (
        <p className="text-sm text-muted-foreground">Memuat fasilitas…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {facilities.map((facility) => (
            <Card key={facility.id} className="gap-3 p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{facility.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {facility.location}
                  </p>
                </div>
                <Badge variant="secondary">
                  {statusLabel[facility.status]}
                </Badge>
              </div>
              <p className="text-sm">
                {facility.type} · {facility.capacity} orang
              </p>
              <p className="text-sm text-muted-foreground">
                {facility.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      id: facility.id,
                      name: facility.name,
                      type: facility.type,
                      location: facility.location,
                      capacity: String(facility.capacity),
                      description: facility.description,
                    })
                  }
                >
                  Ubah
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setStatus({
                      facilityId: facility.id,
                      status:
                        facility.status === "active" ? "inactive" : "active",
                    })
                  }
                >
                  {facility.status === "active" ? "Sembunyikan" : "Aktifkan"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setStatus({
                      facilityId: facility.id,
                      status: "maintenance",
                    })
                  }
                >
                  Perawatan
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export function AdminUsers() {
  const accounts = useQuery(api.admin.listAccounts, {})
  const review = useMutation(api.admin.reviewAccount)
  const setStatus = useMutation(api.admin.setAccountStatus)
  const createAccount = useMutation(api.admin.createAccount)
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"user" | "officer" | "admin">("officer")
  const [message, setMessage] = useState("")

  async function submitAccount(event: FormEvent) {
    event.preventDefault()
    setMessage("")
    try {
      await createAccount({ name, email, temporaryPassword: password, role })
      setName("")
      setEmail("")
      setPassword("")
      setCreateOpen(false)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Pembuatan akun gagal"
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Kelola akun</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifikasi pendaftaran dan buat akun petugas.
          </p>
        </div>
        <Button onClick={() => setCreateOpen((value) => !value)}>
          <IconPlus aria-hidden="true" /> Buat akun
        </Button>
      </div>

      {createOpen && (
        <Card className="p-6">
          <form onSubmit={submitAccount} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama" id="account-name">
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field label="Email" id="account-email">
              <Input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password sementara" id="account-password">
              <Input
                id="account-password"
                type="text"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Field label="Role" id="account-role">
              <select
                id="account-role"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="user">Pengguna</option>
                <option value="officer">Petugas</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            {message && (
              <p className="text-sm text-destructive sm:col-span-2">
                {message}
              </p>
            )}
            <Button type="submit" className="sm:col-span-2">
              Buat akun aktif
            </Button>
          </form>
        </Card>
      )}

      {!accounts ? (
        <p className="text-sm text-muted-foreground">Memuat akun…</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id} className="gap-3 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{account.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {account.email} · {account.role}
                  </p>
                </div>
                <Badge variant="secondary">{statusLabel[account.status]}</Badge>
              </div>
              {account.institutionalId && (
                <p className="text-sm">
                  {account.userKind === "lecturer" ? "NIP" : "NIM"}:{" "}
                  {account.institutionalId}
                </p>
              )}
              <Input
                aria-label="Alasan tindakan"
                placeholder="Alasan penolakan/nonaktif"
                value={reasons[account.id] ?? ""}
                onChange={(e) =>
                  setReasons((current) => ({
                    ...current,
                    [account.id]: e.target.value,
                  }))
                }
              />
              <div className="flex flex-wrap gap-2">
                {account.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        review({ profileId: account.id, decision: "active" })
                      }
                    >
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        review({
                          profileId: account.id,
                          decision: "rejected",
                          reason: reasons[account.id],
                        })
                      }
                    >
                      Tolak
                    </Button>
                  </>
                )}
                {account.status === "active" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setStatus({
                        profileId: account.id,
                        status: "disabled",
                        reason: reasons[account.id],
                      })
                    }
                  >
                    Nonaktifkan
                  </Button>
                )}
                {account.status === "disabled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStatus({ profileId: account.id, status: "active" })
                    }
                  >
                    Aktifkan
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
