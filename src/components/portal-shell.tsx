"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  useAppAuth as useConvexAuth,
  useAppMutation as useMutation,
} from "@/lib/data-hooks"
import { IconInfoCircle } from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import { AppSidebar } from "@/components/app-sidebar"
import { DialogMascot } from "@/components/dialog-mascot"
import { PortalOnboarding } from "@/components/portal-onboarding"
import { PortalShellLoading } from "@/components/portal-skeletons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  accountErrorMessage,
  leaveAllAccounts,
  leaveCurrentAccount,
  removeDeviceAccount,
  switchDeviceAccount,
} from "@/lib/device-accounts"
import {
  getActivePortalItem,
  portalRoleMeta,
  type PortalRole,
} from "@/lib/portal-navigation"
import { resolveOnboardingVisit } from "@/lib/portal-onboarding-storage"

const UserOnboardingTour = dynamic(() =>
  import("@/components/user-onboarding-tour").then(
    (module) => module.UserOnboardingTour
  )
)

type PortalProfile = {
  id: string
  name: string
  email: string
  role: PortalRole
  mustChangePassword: boolean
}

function PasswordDialog({
  open,
  required,
  onOpenChange,
  onPasswordChanged,
}: {
  open: boolean
  required: boolean
  onOpenChange: (open: boolean) => void
  onPasswordChanged: () => void
}) {
  const changePassword = useMutation(api.profiles.changePassword)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage("")

    if (newPassword !== confirmation) {
      setMessage("Konfirmasi password baru belum sama.")
      return
    }

    setPending(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmation("")
      onPasswordChanged()
      onOpenChange(false)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Password lama tidak sesuai atau password baru tidak valid."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!required && !pending) onOpenChange(false)
      }}
      labelledBy="password-dialog-title"
      size="md"
    >
      <DialogHeader className="relative mb-7 flex-col items-center gap-5 pt-2 text-center sm:flex-row sm:text-left">
        <DialogMascot mood="secure" className="size-28 sm:size-32" />
        <div className="min-w-0 sm:pr-6">
          <DialogTitle
            id="password-dialog-title"
            className="text-xl font-semibold"
          >
            {required ? "Amankan akun Anda" : "Ganti password"}
          </DialogTitle>
          <DialogDescription className="mt-2 leading-relaxed">
            {required
              ? "Password sementara wajib diganti sebelum Anda menggunakan portal."
              : "Sesi lain akan dikeluarkan setelah password diperbarui."}
          </DialogDescription>
        </div>
        {!required ? (
          <div className="absolute -top-2 -right-1">
            <DialogCloseButton onClose={() => onOpenChange(false)} />
          </div>
        ) : null}
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Password saat ini</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Password baru</Label>
          <Input
            id="new-password"
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            aria-describedby="password-hint"
            required
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            Gunakan minimal 8 karakter yang tidak mudah ditebak.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Ulangi password baru</Label>
          <Input
            id="confirm-password"
            type="password"
            minLength={8}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {message ? (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Menyimpan…" : "Perbarui password"}
        </Button>
      </form>
    </Dialog>
  )
}

export function PortalShell({
  children,
  profile,
  sidebarDefaultOpen = true,
}: {
  children: ReactNode
  profile: PortalProfile
  sidebarDefaultOpen?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordChangedLocally, setPasswordChangedLocally] = useState(false)
  const [logoutKind, setLogoutKind] = useState<"current" | "all" | null>(null)
  const [navigationPending, setNavigationPending] = useState(false)
  const [accountError, setAccountError] = useState("")
  const [removeTarget, setRemoveTarget] = useState<{
    token: string
    email: string
  } | null>(null)
  const [removePending, setRemovePending] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [repeatOnboarding, setRepeatOnboarding] = useState(false)
  const onboardingKey = `sthana:onboarding:v1:${profile.id}:${profile.role}`
  const role = portalRoleMeta[profile.role]
  const activeItem = getActivePortalItem(profile.role, pathname)
  const passwordChangeRequired =
    !isLoading &&
    isAuthenticated &&
    profile.mustChangePassword &&
    !passwordChangedLocally

  useEffect(() => {
    if (!navigationPending && !isLoading && !isAuthenticated) {
      router.replace("/login")
      router.refresh()
    }
  }, [isAuthenticated, isLoading, navigationPending, router])

  useEffect(() => {
    if (isLoading || !isAuthenticated || passwordChangeRequired) return

    const timer = window.setTimeout(() => {
      try {
        const { repeat, shouldShow } = resolveOnboardingVisit(
          onboardingKey,
          localStorage,
          sessionStorage
        )
        setRepeatOnboarding(repeat)
        if (shouldShow) setOnboardingOpen(true)
      } catch {
        setOnboardingOpen(true)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isAuthenticated, isLoading, onboardingKey, passwordChangeRequired])

  const closeOnboarding = useCallback(() => setOnboardingOpen(false), [])

  const handleRepeatOnboardingChange = useCallback(
    (repeat: boolean) => {
      setRepeatOnboarding(repeat)
      try {
        localStorage.setItem(`${onboardingKey}:repeat`, repeat ? "1" : "0")
      } catch {
        // The toggle remains usable for this visit when storage is unavailable.
      }
    },
    [onboardingKey]
  )

  if ((!isLoading && !isAuthenticated) || navigationPending) {
    return <PortalShellLoading />
  }

  async function switchAccount(token: string) {
    setNavigationPending(true)
    setAccountError("")
    try {
      await switchDeviceAccount(token)
      window.location.replace("/portal")
    } catch (cause) {
      setNavigationPending(false)
      setAccountError(
        accountErrorMessage(cause, "Tidak dapat mengganti akun. Coba lagi.")
      )
    }
  }

  async function logout() {
    if (!logoutKind) return
    const kind = logoutKind
    setNavigationPending(true)
    setAccountError("")
    try {
      if (kind === "all") await leaveAllAccounts()
      else await leaveCurrentAccount()
      try {
        sessionStorage.removeItem(`${onboardingKey}:session`)
      } catch {
        // Storage may be unavailable; leaving the account should still succeed.
      }
      window.location.replace(kind === "all" ? "/login" : "/portal")
    } catch (cause) {
      setNavigationPending(false)
      setLogoutKind(null)
      setAccountError(
        accountErrorMessage(cause, "Tidak dapat keluar dari akun. Coba lagi.")
      )
    }
  }

  async function removeStoredAccount() {
    if (!removeTarget) return
    setRemovePending(true)
    try {
      await removeDeviceAccount(removeTarget.token)
      setRemoveTarget(null)
    } catch (cause) {
      setRemoveTarget(null)
      setAccountError(
        accountErrorMessage(cause, "Akun tidak dapat dilepas. Coba lagi.")
      )
    } finally {
      setRemovePending(false)
    }
  }

  function handlePasswordChanged() {
    setPasswordChangedLocally(true)
    router.refresh()
  }

  return (
    <TooltipProvider delay={250}>
      <SidebarProvider
        defaultOpen={sidebarDefaultOpen}
        style={
          {
            "--sidebar-width": "17.5rem",
            "--sidebar-width-icon": "4.25rem",
          } as React.CSSProperties
        }
        className="bg-[#f7f4f6] dark:bg-[#17131a]"
      >
        <AppSidebar
          profile={profile}
          onChangePassword={() => setPasswordDialogOpen(true)}
          onLogoutCurrent={() => setLogoutKind("current")}
          onLogoutAll={() => setLogoutKind("all")}
          onSwitchAccount={(token) => void switchAccount(token)}
          onRemoveAccount={(token, email) => setRemoveTarget({ token, email })}
        />
        <SidebarInset className="min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(255,229,242,0.55),transparent_32%),#fbfafb] dark:bg-[radial-gradient(circle_at_top_right,rgba(135,25,84,0.18),transparent_32%),#17131a]">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-pink-950/5 bg-white/80 px-4 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-[#201a23]/85">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger
                className="-ml-1 rounded-xl"
                aria-label="Buka atau tutup navigasi"
              />
              <Separator
                orientation="vertical"
                className="mx-1 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden sm:block">
                    <BreadcrumbLink render={<Link href={role.home} />}>
                      Portal {role.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeItem.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOnboardingOpen((open) => !open)}
                disabled={passwordChangeRequired}
                aria-label={
                  onboardingOpen
                    ? "Tutup panduan portal"
                    : "Buka panduan portal"
                }
                aria-pressed={onboardingOpen}
                title="Panduan portal"
                className="rounded-xl text-[#8a2958] hover:bg-pink-50 dark:text-pink-200 dark:hover:bg-pink-950/50"
              >
                <IconInfoCircle size={17} aria-hidden="true" />
                <span className="hidden sm:inline">Panduan</span>
              </Button>
              <span className="hidden rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-[#9f004c] sm:inline-flex dark:bg-pink-900/40 dark:text-pink-200">
                {role.label}
              </span>
              <AnimatedThemeToggler
                className="flex size-9 items-center justify-center rounded-xl border border-transparent text-[#8a2958] transition-colors hover:border-pink-200 hover:bg-pink-50 dark:text-pink-200 dark:hover:border-pink-800 dark:hover:bg-pink-950/50 [&_svg]:size-4"
                aria-label="Ganti tema terang atau gelap"
                title="Ganti tema"
              />
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>

      <PasswordDialog
        open={passwordDialogOpen || passwordChangeRequired}
        required={passwordChangeRequired}
        onOpenChange={setPasswordDialogOpen}
        onPasswordChanged={handlePasswordChanged}
      />

      {onboardingOpen && !passwordChangeRequired && profile.role === "user" ? (
        <UserOnboardingTour
          pathname={pathname}
          repeat={repeatOnboarding}
          onRepeatChange={handleRepeatOnboardingChange}
          onClose={closeOnboarding}
        />
      ) : null}

      {onboardingOpen && !passwordChangeRequired && profile.role !== "user" ? (
        <PortalOnboarding
          role={profile.role}
          repeat={repeatOnboarding}
          onRepeatChange={handleRepeatOnboardingChange}
          onClose={closeOnboarding}
        />
      ) : null}

      <AlertDialog
        open={logoutKind !== null}
        onOpenChange={(open) => {
          if (!navigationPending && !open) setLogoutKind(null)
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg gap-5 bg-card p-6 text-card-foreground shadow-2xl ring-foreground/10 sm:p-7 data-[size=default]:sm:max-w-lg dark:bg-[#251d28] dark:text-[#f8ecf3] dark:ring-white/10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <DialogMascot mood="goodbye" className="size-28 sm:size-32" />
            <div className="min-w-0">
              <AlertDialogTitle className="text-xl font-semibold">
                {logoutKind === "all"
                  ? "Keluar dari semua akun?"
                  : "Keluar dari akun ini?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 leading-relaxed">
                {logoutKind === "all"
                  ? "Semua akun tersimpan di browser ini akan dikeluarkan."
                  : "Akun lain di browser ini tetap tersedia untuk dipilih."}
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={navigationPending}>
              Tetap di sini
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
              disabled={navigationPending}
              onClick={() => void logout()}
            >
              {navigationPending ? "Mengeluarkan…" : "Ya, keluar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open && !removePending) setRemoveTarget(null)
        }}
      >
        <AlertDialogContent className="max-w-sm bg-card text-card-foreground">
          <AlertDialogTitle>Lepas akun tersimpan?</AlertDialogTitle>
          <AlertDialogDescription>
            {removeTarget?.email} akan perlu login lagi untuk digunakan di
            browser ini.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={removePending}
              onClick={() => void removeStoredAccount()}
            >
              {removePending ? "Melepas…" : "Lepas akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(accountError)}
        onOpenChange={(open) => {
          if (!open) setAccountError("")
        }}
      >
        <AlertDialogContent className="max-w-sm bg-card text-card-foreground">
          <AlertDialogTitle>Tindakan gagal</AlertDialogTitle>
          <AlertDialogDescription>{accountError}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAccountError("")}>
              Tutup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
