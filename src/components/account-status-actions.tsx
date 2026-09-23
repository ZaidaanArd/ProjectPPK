"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MAX_DEVICE_ACCOUNTS } from "@/lib/account-routing"
import {
  accountErrorMessage,
  getActiveSessionToken,
  getDeviceAccounts,
  isLegacySession,
  leaveCurrentAccount,
  switchDeviceAccount,
  type DeviceAccount,
} from "@/lib/device-accounts"

export function AccountStatusActions() {
  const [accounts, setAccounts] = useState<DeviceAccount[]>([])
  const [activeToken, setActiveToken] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [retryKey, setRetryKey] = useState(0)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const legacy = isLegacySession(activeToken, accounts)
  const full = accounts.length >= MAX_DEVICE_ACCOUNTS

  useEffect(() => {
    let cancelled = false
    void Promise.all([getDeviceAccounts(), getActiveSessionToken()])
      .then(([items, token]) => {
        if (cancelled) return
        setAccounts(items)
        setActiveToken(token)
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(
            accountErrorMessage(cause, "Daftar akun tidak dapat dimuat.")
          )
      })
    return () => {
      cancelled = true
    }
  }, [retryKey])

  async function switchAccount(token: string) {
    setPending(true)
    setError("")
    try {
      await switchDeviceAccount(token)
      window.location.replace("/portal")
    } catch {
      setError("Tidak dapat mengganti akun. Coba lagi.")
      setPending(false)
    }
  }

  async function leave() {
    setPending(true)
    setError("")
    try {
      await leaveCurrentAccount()
      window.location.replace("/portal")
    } catch {
      setError("Tidak dapat keluar dari akun ini. Coba lagi.")
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      {accounts.some(({ session }) => session.token !== activeToken) ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Gunakan akun lain</p>
          {accounts
            .filter(({ session }) => session.token !== activeToken)
            .map(({ session, user }) => (
              <Button
                key={session.id}
                variant="outline"
                className="h-auto w-full justify-start py-3 text-left"
                disabled={pending}
                onClick={() => void switchAccount(session.token)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </span>
              </Button>
            ))}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Coba lagi
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {full ? (
          <p className="w-full text-sm text-muted-foreground">
            Batas {MAX_DEVICE_ACCOUNTS} akun tercapai. Lepas satu akun sebelum
            menambah akun lain.
          </p>
        ) : (
          <Link href="/login/add-account" className={buttonVariants()}>
            {legacy ? "Aktifkan ganti akun" : "Tambah akun"}
          </Link>
        )}
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => setConfirmLeave(true)}
        >
          Keluar akun ini
        </Button>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Beranda publik
        </Link>
      </div>
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent className="max-w-sm bg-card text-card-foreground">
          <AlertDialogTitle>Keluar dari akun ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Akun lain yang tersimpan di browser ini tetap tersedia.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={() => void leave()}>
              Keluar akun ini
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
