"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useConvexAuth, useMutation } from "convex/react"
import { IconLogout } from "@tabler/icons-react"

import { api } from "../../convex/_generated/api"
import { AppSidebar } from "@/components/app-sidebar"
import { PortalShellLoading } from "@/components/portal-skeletons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
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
import { authClient } from "@/lib/auth-client"
import {
  getActivePortalItem,
  portalRoleMeta,
  type PortalRole,
} from "@/lib/portal-navigation"

type PortalProfile = {
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
      <DialogHeader>
        <div>
          <DialogTitle id="password-dialog-title">
            {required ? "Amankan akun Anda" : "Ganti password"}
          </DialogTitle>
          <DialogDescription>
            {required
              ? "Password sementara wajib diganti sebelum Anda menggunakan portal."
              : "Sesi lain akan dikeluarkan setelah password diperbarui."}
          </DialogDescription>
        </div>
        {!required ? (
          <DialogCloseButton onClose={() => onOpenChange(false)} />
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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [logoutPending, setLogoutPending] = useState(false)
  const role = portalRoleMeta[profile.role]
  const activeItem = getActivePortalItem(profile.role, pathname)
  const passwordChangeRequired =
    !isLoading &&
    isAuthenticated &&
    profile.mustChangePassword &&
    !passwordChangedLocally

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
      router.refresh()
    }
  }, [isAuthenticated, isLoading, router])

  if ((!isLoading && !isAuthenticated) || logoutPending) {
    return <PortalShellLoading />
  }

  async function logout() {
    setLogoutPending(true)
    try {
      await authClient.signOut()
      router.replace("/login")
      router.refresh()
    } finally {
      setLogoutPending(false)
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
          onLogout={() => setLogoutDialogOpen(true)}
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

      <AlertDialog
        open={logoutDialogOpen}
        onOpenChange={(open) => {
          if (!logoutPending) setLogoutDialogOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-50 text-destructive">
              <IconLogout aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Keluar dari Sthana?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda perlu masuk kembali untuk mengakses portal dan data akun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logoutPending}>
              Tetap di sini
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={logoutPending}
              onClick={() => void logout()}
            >
              {logoutPending ? "Mengeluarkan…" : "Ya, keluar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
