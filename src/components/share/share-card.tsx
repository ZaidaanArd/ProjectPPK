import type { Ref } from "react"

import { SthaniFace, type SthaniExpression } from "@/components/sthani-face"
import { displayDuration } from "@/lib/reservation-slots"
import {
  reportSteps,
  reservationSteps,
  type ProgressStep,
} from "@/lib/status-steps"
import { cn } from "@/lib/utils"

export type ShareSubject =
  | {
      kind: "reservation"
      facilityName: string
      location?: string
      startAt: number
      endAt: number
      status: string
      statusLabel: string
      purpose: string
      createdAt: number
      updatedAt?: number
    }
  | {
      kind: "report"
      facilityName: string
      category: string
      description: string
      status: string
      statusLabel: string
      createdAt: number
      updatedAt?: number
    }

export type ShareFormat = "post" | "story"

export const shareSizes: Record<
  ShareFormat,
  { width: number; height: number }
> = {
  post: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
}

const statusColor: Record<string, string> = {
  pending: "linear-gradient(135deg,#f59e0b,#f97316)",
  approved: "linear-gradient(135deg,#10b981,#059669)",
  in_progress: "linear-gradient(135deg,#38bdf8,#2563eb)",
  resolved: "linear-gradient(135deg,#10b981,#059669)",
  rejected: "linear-gradient(135deg,#f43f5e,#be123c)",
  cancelled: "linear-gradient(135deg,#a1a1aa,#52525b)",
}

const statusEmoji: Record<string, string> = {
  pending: "⏳",
  approved: "✅",
  in_progress: "🔧",
  resolved: "✨",
  rejected: "🙅",
  cancelled: "🗓️",
}

const mascot: Record<string, SthaniExpression> = {
  pending: "ngantuk",
  approved: "senang",
  in_progress: "keren",
  resolved: "sayang",
  rejected: "sedih",
  cancelled: "sedih",
}

const cheer: Record<string, Record<string, string>> = {
  reservation: {
    pending: "Lagi ditinjau petugas, sabar ya~",
    approved: "Ruangannya siap dipakai! Sampai ketemu di sana!",
    rejected: "Belum rezeki. Coba jadwal lain, yuk!",
    cancelled: "Reservasi ini dibatalkan. Jadwal lain menanti!",
  },
  report: {
    pending: "Laporan diterima. Makasih udah peduli kampus!",
    in_progress: "Petugas lagi turun tangan membereskannya!",
    resolved: "Beres! Fasilitasnya siap dipakai lagi.",
    rejected: "Laporan ditutup petugas. Tetap semangat!",
  },
}

const weekdayDate = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Jakarta",
})
const shortDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
})
const clock = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
})

function details(subject: ShareSubject): [string, string][] {
  if (subject.kind === "reservation") {
    const minutes = Math.round((subject.endAt - subject.startAt) / 60000)
    return [
      ["Tanggal", weekdayDate.format(subject.startAt)],
      [
        "Waktu",
        `${clock.format(subject.startAt)}–${clock.format(subject.endAt)} WIB · ${displayDuration(minutes)}`,
      ],
    ]
  }
  return [
    ["Kategori", subject.category],
    ["Dilaporkan", shortDate.format(subject.createdAt)],
  ]
}

function steps(subject: ShareSubject): ProgressStep[] {
  return subject.kind === "reservation"
    ? reservationSteps(subject)
    : reportSteps(subject)
}

/**
 * Fixed-size artwork for the share image. Rendered at full size offscreen
 * for capture, and scaled down with CSS for the preview.
 */
export function ShareCard({
  subject,
  format,
  dark,
  snippet,
  ref,
}: {
  subject: ShareSubject
  format: ShareFormat
  dark: boolean
  snippet: boolean
  ref?: Ref<HTMLDivElement>
}) {
  const story = format === "story"
  const { width, height } = shareSizes[format]
  const quote =
    subject.kind === "reservation" ? subject.purpose : subject.description
  const ink = dark ? "#fdf2f8" : "#2a0f1f"
  const muted = dark ? "rgba(253,242,248,0.62)" : "rgba(42,15,31,0.58)"
  const panel = dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.78)"
  const border = dark ? "rgba(255,184,217,0.16)" : "rgba(208,0,100,0.12)"

  return (
    <div
      ref={ref}
      className="relative flex flex-col overflow-hidden font-sans"
      style={{
        width,
        height,
        padding: story ? "110px 84px 90px" : "72px 72px 60px",
        gap: story ? 44 : 30,
        color: ink,
        background: dark
          ? "linear-gradient(160deg,#1f1424 0%,#170f1b 55%,#2a0f22 100%)"
          : "linear-gradient(160deg,#fff7fb 0%,#ffe4f1 55%,#fdeef6 100%)",
      }}
    >
      {/* Decorative blobs and confetti */}
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          width: 620,
          height: 620,
          right: -200,
          top: -220,
          background: dark
            ? "radial-gradient(circle,rgba(236,72,153,0.35),transparent 70%)"
            : "radial-gradient(circle,rgba(244,114,182,0.45),transparent 70%)",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          width: 520,
          height: 520,
          left: -220,
          bottom: story ? 260 : 120,
          background: dark
            ? "radial-gradient(circle,rgba(168,85,247,0.25),transparent 70%)"
            : "radial-gradient(circle,rgba(251,207,232,0.9),transparent 70%)",
        }}
      />
      {[
        [960, story ? 360 : 300, 16, "#facc15"],
        [880, story ? 230 : 180, 11, "#34d399"],
        [1020, story ? 900 : 520, 14, "#f472b6"],
        [34, story ? 1240 : 760, 16, "#a78bfa"],
        [1030, story ? 1560 : 990, 12, "#f472b6"],
      ].map(([left, top, size, color]) => (
        <span
          key={`${left}-${top}`}
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            left: Number(left),
            top: Number(top),
            width: Number(size),
            height: Number(size),
            background: String(color),
            opacity: 0.8,
          }}
        />
      ))}

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center" style={{ gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/sthana-mark-256.png"
            alt=""
            width={72}
            height={72}
            style={{ width: 72, height: 72 }}
          />
          <span
            className="font-heading font-bold"
            style={{ fontSize: 38, lineHeight: 1 }}
          >
            Sthana <span style={{ color: "#d00064" }}>Kampus</span>
          </span>
        </div>
        <span
          className="rounded-full font-semibold"
          style={{
            padding: "12px 26px",
            fontSize: 26,
            color: dark ? "#ffb3d6" : "#b0005a",
            background: dark ? "rgba(236,72,153,0.16)" : "#ffffff",
            border: `2px solid ${border}`,
          }}
        >
          {subject.kind === "reservation" ? "Reservasi" : "Laporan kendala"}
        </span>
      </div>

      {/* Title */}
      <div className="relative" style={{ marginTop: story ? 40 : 8 }}>
        <p style={{ fontSize: 28, color: muted, fontWeight: 600 }}>
          {subject.kind === "reservation"
            ? "Aku reservasi ruangan"
            : "Aku melaporkan kendala di"}
        </p>
        <h1
          className="font-heading font-bold"
          style={{
            fontSize: story ? 112 : 92,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            marginTop: 10,
          }}
        >
          {subject.facilityName}
        </h1>
        {subject.kind === "reservation" && subject.location && (
          <p style={{ fontSize: 30, color: muted, marginTop: 14 }}>
            📍 {subject.location}
          </p>
        )}
      </div>

      {/* Status stamp + details */}
      <div
        className={cn("relative flex", story && "flex-col")}
        style={{ gap: 22 }}
      >
        <div
          className="flex shrink-0 flex-col justify-between text-white"
          style={{
            width: story ? "auto" : 360,
            minHeight: story ? 220 : 290,
            padding: "30px 34px",
            borderRadius: 40,
            background: statusColor[subject.status] ?? statusColor.cancelled,
            boxShadow: "0 24px 50px -20px rgba(208,0,100,0.45)",
          }}
        >
          <span
            className="flex items-start justify-between"
            style={{ fontSize: 26, fontWeight: 600 }}
          >
            <span style={{ opacity: 0.85 }}>Status</span>
            <span style={{ fontSize: story ? 72 : 64, lineHeight: 1 }}>
              {statusEmoji[subject.status] ?? "📌"}
            </span>
          </span>
          <span
            className="font-heading font-bold"
            style={{
              fontSize: story ? 92 : subject.statusLabel.length > 7 ? 54 : 70,
              lineHeight: 1,
            }}
          >
            {subject.statusLabel}
          </span>
        </div>
        <div className="flex flex-1 flex-col" style={{ gap: 22 }}>
          {details(subject).map(([label, value]) => (
            <div
              key={label}
              className="flex flex-1 flex-col justify-center"
              style={{
                padding: "22px 30px",
                borderRadius: 32,
                background: panel,
                border: `2px solid ${border}`,
              }}
            >
              <span style={{ fontSize: 24, color: muted, fontWeight: 600 }}>
                {label}
              </span>
              <span
                className="font-semibold"
                style={{ fontSize: 34, marginTop: 6, lineHeight: 1.2 }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div
        className="relative flex items-start"
        style={{
          padding: "30px 26px 24px",
          borderRadius: 32,
          background: panel,
          border: `2px solid ${border}`,
        }}
      >
        {steps(subject).map((step, index) => {
          const done = step.state === "done"
          const error = step.state === "error"
          const current = step.state === "current"
          return (
            <div
              key={step.label}
              className="relative flex flex-1 flex-col items-center text-center"
              style={{ gap: 12 }}
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute"
                  style={{
                    top: 24,
                    right: "50%",
                    width: "100%",
                    height: 6,
                    borderRadius: 6,
                    background:
                      step.state === "upcoming"
                        ? dark
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(42,15,31,0.1)"
                        : error
                          ? "#f43f5e"
                          : "#ec4899",
                  }}
                />
              )}
              <span
                className="relative grid place-items-center rounded-full font-bold"
                style={{
                  width: 54,
                  height: 54,
                  fontSize: 26,
                  color: done || error ? "#fff" : "#d00064",
                  background: error
                    ? "#f43f5e"
                    : done
                      ? "#d00064"
                      : dark
                        ? "#1f1424"
                        : "#fff",
                  border: `5px solid ${error ? "#f43f5e" : done || current ? "#ec4899" : border}`,
                }}
              >
                {done ? "✓" : error ? "✕" : index + 1}
              </span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: current || done || error ? 700 : 500,
                  color: step.state === "upcoming" ? muted : ink,
                }}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Quote bubble with Sthani */}
      <div className="relative flex items-stretch" style={{ gap: 20, flex: 1 }}>
        <div
          className="relative flex flex-1 flex-col justify-center"
          style={{
            padding: story ? "40px 44px" : "30px 36px",
            borderRadius: 40,
            borderBottomRightRadius: 12,
            background: panel,
            border: `2px solid ${border}`,
          }}
        >
          <span
            className="font-heading font-bold"
            style={{ fontSize: 80, lineHeight: 0.5, color: "#ec4899" }}
          >
            “
          </span>
          <p
            style={{
              fontSize: story ? 40 : 32,
              lineHeight: 1.4,
              marginTop: 8,
              display: "-webkit-box",
              WebkitLineClamp: story ? 5 : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {snippet && quote.trim()
              ? quote
              : (cheer[subject.kind]?.[subject.status] ?? "Sthana Kampus!")}
          </p>
          <p
            style={{
              fontSize: 22,
              color: muted,
              marginTop: 14,
              fontWeight: 600,
            }}
          >
            {snippet && quote.trim()
              ? subject.kind === "reservation"
                ? "Tujuan penggunaan"
                : "Rincian kendala"
              : "— Sthani, maskot Sthana"}
          </p>
          {snippet && quote.trim() && (
            <p
              className="self-start rounded-full font-semibold"
              style={{
                marginTop: 22,
                padding: "12px 24px",
                fontSize: story ? 28 : 24,
                color: dark ? "#ffc1de" : "#9d174d",
                background: dark ? "rgba(236,72,153,0.16)" : "#fce7f3",
              }}
            >
              💬 Sthani: {cheer[subject.kind]?.[subject.status] ?? "Semangat!"}
            </p>
          )}
        </div>
        <SthaniFace
          expression={mascot[subject.status] ?? "senang"}
          className={cn("self-end", story ? "!w-[300px]" : "!w-[230px]")}
        />
      </div>

      {/* Footer */}
      <div
        className="relative flex items-center justify-between"
        style={{
          paddingTop: 26,
          borderTop: `2px solid ${border}`,
          fontSize: 24,
          color: muted,
          fontWeight: 600,
        }}
      >
        <span>sthana.myudak.com</span>
        <span>Reservasi & laporan fasilitas kampus 💗</span>
      </div>
    </div>
  )
}
