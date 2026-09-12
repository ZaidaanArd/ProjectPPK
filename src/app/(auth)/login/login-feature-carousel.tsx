"use client"

import { useEffect, useState } from "react"
import {
  IconBuilding,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconFileDescription,
} from "@tabler/icons-react"

const slides = [
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

export function LoginFeatureCarousel() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  const slide = slides[activeSlide]
  const SlideIcon = slide.icon

  function showPrevious() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length)
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % slides.length)
  }

  return (
    <div className="w-full max-w-[540px] px-10 xl:px-0">
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
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Fitur sebelumnya"
            className="flex size-8 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            <IconChevronLeft size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Fitur berikutnya"
            className="flex size-8 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            <IconChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-7 flex gap-2" aria-label="Pilih fitur">
        {slides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActiveSlide(index)}
            aria-label={`Tampilkan fitur ${index + 1}: ${item.title}`}
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
  )
}
