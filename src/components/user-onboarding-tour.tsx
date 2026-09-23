"use client"

import { createContext, useContext, useEffect, useMemo, useRef } from "react"
import { IconX } from "@tabler/icons-react"
import { MotionConfig, useReducedMotion } from "framer-motion"
import { Onborda, OnbordaProvider, useOnborda } from "onborda"
import type { CardComponentProps, Step } from "onborda"

import { SthaniFace } from "@/components/sthani-face"
import { Button } from "@/components/ui/button"

type TourControls = {
  repeat: boolean
  onRepeatChange: (repeat: boolean) => void
  onClose: () => void
}

const TourControlsContext = createContext<TourControls | null>(null)

function step(
  title: string,
  content: string,
  selector: string,
  side: Step["side"] = "bottom"
): Step {
  return {
    icon: null,
    title,
    content,
    selector,
    side,
    pointerPadding: 12,
    pointerRadius: 14,
  }
}

const toursByPath: Record<string, Step[]> = {
  "/app": [
    step(
      "Ringkasan aktivitas",
      "Lihat reservasi dan laporan terbaru di sini.",
      "#portal-home-summary"
    ),
    step(
      "Cari fasilitas",
      "Cari ruang dan cek jadwal yang tersedia.",
      "#portal-find-facilities"
    ),
    step(
      "Ajukan reservasi",
      "Pilih fasilitas dan waktu penggunaan.",
      "#portal-reservation-action"
    ),
    step(
      "Buat laporan",
      "Laporkan kendala fasilitas untuk ditangani petugas.",
      "#portal-report-action"
    ),
  ],
  "/app/reservations": [
    step(
      "Reservasi saya",
      "Pantau status pengajuan dan jadwal Anda.",
      "#reservation-overview"
    ),
    step(
      "Ajukan reservasi",
      "Buka formulir untuk memilih fasilitas dan waktu.",
      "#reservation-primary-action"
    ),
  ],
  "/app/reservations/new": [
    step(
      "Pilih fasilitas",
      "Cari nama atau lokasi, lalu pilih satu kartu fasilitas.",
      "#reservation-facility-picker"
    ),
    step(
      "Pilih waktu",
      "Tentukan tanggal serta jam mulai dan selesai.",
      "#reservation-schedule",
      "top"
    ),
    step(
      "Tulis tujuan",
      "Jelaskan keperluan penggunaan ruang.",
      "#reservation-purpose",
      "top"
    ),
    step(
      "Kirim reservasi",
      "Petugas akan meninjau pengajuan Anda.",
      "#reservation-submit",
      "top-left"
    ),
  ],
  "/app/reports": [
    step(
      "Laporan saya",
      "Pantau status penanganan kendala fasilitas.",
      "#report-overview"
    ),
    step(
      "Buat laporan",
      "Buka formulir untuk melaporkan kendala.",
      "#report-primary-action"
    ),
  ],
  "/app/reports/new": [
    step(
      "Pilih fasilitas",
      "Pilih fasilitas yang mengalami kendala.",
      "#report-facility-field"
    ),
    step(
      "Kategori",
      "Tulis jenis kendala, misalnya AC atau proyektor.",
      "#report-category-field",
      "top"
    ),
    step(
      "Jelaskan kendala",
      "Tambahkan rincian dan foto jika diperlukan.",
      "#report-description-field",
      "top"
    ),
    step(
      "Kirim laporan",
      "Pantau perkembangannya di halaman Laporan.",
      "#report-submit",
      "top-left"
    ),
  ],
}

function TourCard({
  step: current,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
}: CardComponentProps) {
  const controls = useContext(TourControlsContext)
  const { closeOnborda } = useOnborda()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [currentStep])

  if (!controls) return null

  function close() {
    closeOnborda()
    controls?.onClose()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), [href]"
      )
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === headingRef.current)
    ) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <dialog
      open
      aria-modal="true"
      aria-labelledby="user-tour-title"
      onKeyDown={handleKeyDown}
      className="relative m-0 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-pink-200 bg-card p-4 text-card-foreground shadow-2xl dark:border-pink-300/20 dark:bg-[#2b202b]"
    >
      <div className="flex items-start justify-between gap-3">
        <SthaniFace
          expression={currentStep === 0 ? "senang" : "keren"}
          className="!w-14"
        />
        <button
          type="button"
          onClick={close}
          aria-label="Tutup panduan"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-pink-50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-pink-600 dark:hover:bg-white/10"
        >
          <IconX size={17} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-3 text-xs font-semibold text-[#a40050] dark:text-pink-300">
        {currentStep + 1} dari {totalSteps}
      </p>
      <h2
        id="user-tour-title"
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 font-heading text-lg font-bold outline-none"
      >
        {current.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {current.content}
      </p>
      <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={controls.repeat}
          onChange={(event) => controls.onRepeatChange(event.target.checked)}
          className="accent-[#c6005e]"
        />
        Tampilkan tiap masuk
      </label>
      <div className="mt-4 flex justify-end gap-2 border-t pt-4 dark:border-white/10">
        <Button
          variant="outline"
          size="sm"
          onClick={currentStep === 0 ? close : prevStep}
        >
          {currentStep === 0 ? "Lewati" : "Kembali"}
        </Button>
        <Button
          size="sm"
          onClick={currentStep === totalSteps - 1 ? close : nextStep}
        >
          {currentStep === totalSteps - 1 ? "Selesai" : "Lanjut"}
        </Button>
      </div>
    </dialog>
  )
}

function TourCanvas({ pathname }: { pathname: string }) {
  const { startOnborda } = useOnborda()
  const reducedMotion = useReducedMotion()
  const steps = toursByPath[pathname] ?? toursByPath["/app"]
  const tours = useMemo(() => [{ tour: "user", steps }], [steps])

  useEffect(() => {
    const frame = requestAnimationFrame(() => startOnborda("user"))
    return () => cancelAnimationFrame(frame)
  }, [pathname, startOnborda])

  useEffect(
    () => () => {
      for (const { selector } of steps) {
        const target = document.querySelector<HTMLElement>(selector)
        if (target?.style.position === "relative") {
          target.style.removeProperty("position")
        }
      }
    },
    [steps]
  )

  return (
    <MotionConfig reducedMotion="user">
      <Onborda
        steps={tours}
        cardComponent={TourCard}
        shadowRgb="28, 7, 20"
        shadowOpacity="0.62"
        cardTransition={{ type: "tween", duration: reducedMotion ? 0 : 0.24 }}
      >
        <span className="hidden" />
      </Onborda>
    </MotionConfig>
  )
}

export function UserOnboardingTour({
  pathname,
  repeat,
  onRepeatChange,
  onClose,
}: { pathname: string } & TourControls) {
  const controls = useMemo(
    () => ({ repeat, onRepeatChange, onClose }),
    [repeat, onRepeatChange, onClose]
  )

  return (
    <TourControlsContext.Provider value={controls}>
      <OnbordaProvider>
        <TourCanvas pathname={pathname} />
      </OnbordaProvider>
    </TourControlsContext.Provider>
  )
}
