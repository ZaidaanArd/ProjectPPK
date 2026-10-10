"use client"

import Link from "next/link"
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconDatabase,
  IconExternalLink,
  IconKey,
  IconLock,
  IconServer,
  IconShieldCheck,
  IconUser,
  IconWorld,
} from "@tabler/icons-react"
import {
  LazyMotion,
  animate,
  domMax,
  m,
  useInView,
  useReducedMotion,
} from "motion/react"

import { MermaidDiagram } from "@/components/mermaid-diagram"
import type { FlowDoc } from "@/lib/flow-docs"
import { cn } from "@/lib/utils"

/** Recorded flow and YouTube id per user story. */
const storyVideos: { id: string; flow: string; youtube: string }[] = [
  {
    id: "US-01",
    flow: "Pengunjung membuka slot Aula; slot terisi tanpa nama/tujuan pemohon",
    youtube: "36R9m4vyJj4",
  },
  {
    id: "US-02",
    flow: "Filter tipe, pencarian lokasi, dan urutan kapasitas terbesar",
    youtube: "x5sCfOzuBbk",
  },
  {
    id: "US-03",
    flow: "Memilih slot, mengisi tujuan, lalu reservasi muncul di tab Menunggu",
    youtube: "-pdT4QHxXMQ",
  },
  {
    id: "US-04",
    flow: "Membatalkan reservasi sendiri; reservasi pindah ke Riwayat",
    youtube: "4AdxVtS2TjA",
  },
  {
    id: "US-05",
    flow: "Tab Menunggu, Disetujui, dan Riwayat beserta detailnya",
    youtube: "vroDKYY20jg",
  },
  {
    id: "US-06",
    flow: "Laporan dengan kategori, deskripsi, dan foto; file salah ditolak",
    youtube: "NrGiBegeXNY",
  },
  {
    id: "US-07",
    flow: "Petugas mulai menangani laporan; pengguna melihat status Ditangani",
    youtube: "WcaISbO8-YA",
  },
  {
    id: "US-08",
    flow: "Dashboard petugas: reservasi menunggu, laporan baru, jadwal hari ini",
    youtube: "TKbpAK3DeFU",
  },
  {
    id: "US-09",
    flow: "Petugas menyetujui reservasi; slot tampil Terisi bagi pengguna",
    youtube: "ImRtQvGvJSY",
  },
  {
    id: "US-10",
    flow: "Pembatalan oleh petugas meminta alasan dan konfirmasi",
    youtube: "ojvBXT9HPlM",
  },
  {
    id: "US-11",
    flow: "Laporan dimulai, lalu diselesaikan dengan catatan penanganan",
    youtube: "z3gO5Q54f2Q",
  },
  {
    id: "US-12",
    flow: "Fasilitas ditandai Dalam Perbaikan, lalu Aktif kembali",
    youtube: "vGuTuV4xgvY",
  },
  {
    id: "US-13",
    flow: "Admin membuat akun petugas yang langsung aktif",
    youtube: "7yJHs91gHHc",
  },
  {
    id: "US-14",
    flow: "Admin membuat akun pengguna yang langsung aktif",
    youtube: "92om7DlVA6w",
  },
  {
    id: "US-15",
    flow: "Registrasi mandiri, admin menyetujui satu akun dan menolak lainnya",
    youtube: "rdow1GEe9uU",
  },
  {
    id: "US-16",
    flow: "Admin menambah fasilitas, mengubah kapasitas, lalu menyembunyikannya",
    youtube: "a771pUIvaFY",
  },
  {
    id: "US-17",
    flow: "Admin melihat rekap per fasilitas/lokasi dan mengunduh CSV",
    youtube: "LVA5abWgMBo",
  },
]

type TabKey = "arsitektur" | "data" | "pengujian" | "keamanan" | "alur"

const tabs: { key: TabKey; label: string; hint: string }[] = [
  { key: "arsitektur", label: "Arsitektur", hint: "Alur permintaan" },
  { key: "data", label: "Data", hint: "Tabel & status" },
  { key: "pengujian", label: "Pengujian", hint: "Test & UAT" },
  { key: "keamanan", label: "Keamanan", hint: "Peran & akses" },
  { key: "alur", label: "Alur logika", hint: "Semua diagram" },
]

/** Advances an index on an interval while `running`. */
function useTicker(length: number, ms: number, running: boolean) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % length),
      ms
    )
    return () => window.clearInterval(timer)
  }, [length, ms, running])
  return [index, setIndex] as const
}

function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-pink-700 dark:text-pink-300"
    >
      {children}
      <IconArrowRight
        size={16}
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-1"
      />
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Arsitektur                                                          */
/* ------------------------------------------------------------------ */

const nodes = [
  { name: "Browser", role: "Halaman & portal", icon: IconWorld },
  { name: "Next.js", role: "Halaman & auth proxy", icon: IconServer },
  { name: "Better Auth", role: "Identitas & sesi", icon: IconKey },
  { name: "Convex function", role: "Validasi & aturan", icon: IconShieldCheck },
  { name: "Convex DB", role: "Data, indeks, foto", icon: IconDatabase },
]

type Hop = { from: number; to: number; title: string; detail: string }

const scenarios: { key: string; label: string; hops: Hop[] }[] = [
  {
    key: "reservasi",
    label: "Ajukan reservasi",
    hops: [
      {
        from: 0,
        to: 3,
        title: "Mutation + JWT",
        detail:
          "Browser memanggil reservations.create langsung ke Convex dengan token sesi.",
      },
      {
        from: 3,
        to: 3,
        title: "Cek identitas & peran",
        detail:
          "Fungsi memvalidasi argumen, status akun aktif, dan peran pengguna sebelum apa pun disimpan.",
      },
      {
        from: 3,
        to: 4,
        title: "Cek bentrok slot",
        detail:
          "Slot dibaca lewat indeks by_facility_status_start; hanya reservasi disetujui yang memblokir.",
      },
      {
        from: 3,
        to: 4,
        title: "Simpan + audit",
        detail:
          "Reservasi tersimpan sebagai Menunggu dan aksinya dicatat di auditEvents dalam satu transaksi.",
      },
      {
        from: 4,
        to: 0,
        title: "Update reaktif",
        detail:
          "Query yang berlangganan—portal pengguna dan antrean petugas—langsung menerima data baru.",
      },
    ],
  },
  {
    key: "masuk",
    label: "Masuk",
    hops: [
      {
        from: 0,
        to: 1,
        title: "POST /api/auth/sign-in",
        detail: "Form login mengirim email dan password ke route auth Next.js.",
      },
      {
        from: 1,
        to: 2,
        title: "Proxy ke Better Auth",
        detail:
          "Next.js meneruskan permintaan ke Better Auth yang berjalan di HTTP action Convex.",
      },
      {
        from: 2,
        to: 3,
        title: "Gerbang akun pending",
        detail:
          "Sebelum sesi dibuat, status profil diperiksa—akun yang belum disetujui tidak mendapat sesi.",
      },
      {
        from: 2,
        to: 0,
        title: "Cookie sesi HttpOnly",
        detail:
          "Sesi dikirim sebagai cookie HttpOnly; layout server memakainya untuk menjaga /app, /staff, dan /admin.",
      },
    ],
  },
  {
    key: "laporan",
    label: "Lapor + foto",
    hops: [
      {
        from: 0,
        to: 3,
        title: "Minta upload URL",
        detail: "Pengguna meminta URL unggah sekali pakai dari Convex.",
      },
      {
        from: 0,
        to: 4,
        title: "Unggah langsung",
        detail:
          "Foto dikirim langsung ke Convex storage, tanpa melewati server lain.",
      },
      {
        from: 3,
        to: 4,
        title: "Validasi file",
        detail:
          "Server membaca metadata: maksimal 5 MB dan hanya JPEG, PNG, atau WebP.",
      },
      {
        from: 3,
        to: 4,
        title: "Laporan tersimpan",
        detail:
          "Laporan masuk berstatus Menunggu dan langsung muncul di antrean petugas.",
      },
    ],
  },
]

const invariants = [
  "Semua fungsi Convex punya validator argumen dan hasil.",
  "Hanya reservasi disetujui yang memblokir slot.",
  "Waktu 07.00–20.00 WIB, satu hari, kelipatan 30 menit.",
  "Data tidak dihapus destruktif; aksi penting masuk auditEvents.",
]

function center(index: number) {
  return `${((index + 0.5) / nodes.length) * 100}%`
}

function ArchitecturePanel({
  live,
  reduced,
}: {
  live: boolean
  reduced: boolean
}) {
  const [scenario, setScenario] = useState(0)
  const hops = scenarios[scenario]?.hops ?? []
  const [step, setStep] = useTicker(hops.length, 2600, live && !reduced)
  const hop = hops[step] ?? hops[0]
  if (!hop) return null

  return (
    <div className="space-y-6">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Skenario</legend>
        {scenarios.map((item, index) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={scenario === index}
            onClick={() => {
              setScenario(index)
              setStep(0)
            }}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              scenario === index
                ? "border-pink-500 bg-pink-600 text-white"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </fieldset>

      <div className="relative rounded-3xl border border-pink-100 bg-gradient-to-b from-white to-pink-50/60 p-4 sm:p-6 dark:border-white/10 dark:from-white/[0.03] dark:to-pink-500/[0.04]">
        {/* Packet track (desktop) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-[3.25rem] hidden h-1 rounded-full bg-pink-100 sm:inset-x-6 md:block dark:bg-white/10"
        >
          {/* A full-width wrapper translated by a % of its own width moves
              the dot along the track using transforms only. */}
          <m.span
            key={`${scenario}-${step}`}
            className="absolute inset-0"
            initial={{ x: center(hop.from) }}
            animate={{ x: center(hop.to) }}
            transition={{
              duration: reduced ? 0 : 1.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <m.span
              className="absolute top-1/2 left-0 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500 shadow-[0_0_0_6px_rgba(236,72,153,0.2),0_0_24px_rgba(236,72,153,0.7)]"
              initial={{ scale: 0.6 }}
              animate={{ scale: hop.from === hop.to ? [0.6, 1.4, 1] : 1 }}
              transition={{ duration: reduced ? 0 : 1.1 }}
            />
          </m.span>
        </div>

        <ol
          className="relative grid gap-3 md:grid-cols-5"
          aria-label="Komponen sistem"
        >
          {nodes.map((node, index) => {
            const Icon = node.icon
            const active = index === hop.from || index === hop.to
            return (
              <li
                key={node.name}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-background/90 p-3 transition-all duration-500 md:flex-col md:text-center",
                  active
                    ? "border-pink-400 shadow-lg shadow-pink-500/15 md:-translate-y-1"
                    : "border-border/70"
                )}
              >
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-2xl transition-colors duration-500",
                    active
                      ? "bg-pink-600 text-white"
                      : "bg-pink-50 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300"
                  )}
                >
                  <Icon size={22} stroke={1.7} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm">{node.name}</strong>
                  <span className="block text-xs text-muted-foreground">
                    {node.role}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>

        <ol
          className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
          aria-label="Langkah"
        >
          {hops.map((item, index) => (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => setStep(index)}
                aria-current={index === step ? "step" : undefined}
                className={cn(
                  "h-full w-full rounded-2xl border p-3 text-left transition-colors",
                  index === step
                    ? "border-pink-300 bg-white shadow-sm dark:border-pink-400/40 dark:bg-white/[0.06]"
                    : "border-transparent hover:bg-white/70 dark:hover:bg-white/[0.04]"
                )}
              >
                <span className="text-[11px] font-bold text-pink-600 dark:text-pink-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong className="mt-0.5 block text-sm">{item.title}</strong>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {item.detail}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <ul className="grid gap-2 sm:grid-cols-2">
          {invariants.map((text) => (
            <li key={text} className="flex items-start gap-2 text-sm">
              <IconCheck
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              {text}
            </li>
          ))}
        </ul>
        <DocLink href="/docs/architecture">Baca arsitektur</DocLink>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const tables = [
  {
    name: "profiles",
    note: "Akun, peran, status",
    fields: ["authUserId", "role", "status", "mustChangePassword"],
    links: [],
  },
  {
    name: "facilities",
    note: "Ruang & statusnya",
    fields: ["name", "type", "capacity", "status"],
    links: ["profiles"],
  },
  {
    name: "reservations",
    note: "Jadwal pemakaian",
    fields: ["startAt", "endAt", "purpose", "status"],
    links: ["profiles", "facilities"],
  },
  {
    name: "reports",
    note: "Kendala fasilitas",
    fields: ["category", "photoStorageId", "status", "resolutionNote"],
    links: ["profiles", "facilities"],
  },
  {
    name: "auditEvents",
    note: "Jejak setiap aksi",
    fields: ["entityType", "action", "fromStatus", "toStatus"],
    links: ["profiles"],
  },
]

const machines = [
  {
    title: "Reservasi",
    start: { key: "pending", label: "Menunggu" },
    ends: [
      { key: "approved", label: "Disetujui", tone: "emerald" },
      { key: "rejected", label: "Ditolak", tone: "red" },
      { key: "cancelled", label: "Dibatalkan", tone: "zinc" },
    ],
    middle: null,
  },
  {
    title: "Laporan",
    start: { key: "pending", label: "Menunggu" },
    middle: { key: "in_progress", label: "Ditangani" },
    ends: [
      { key: "resolved", label: "Selesai", tone: "emerald" },
      { key: "rejected", label: "Ditolak", tone: "red" },
    ],
  },
] as const

const toneClass = {
  emerald:
    "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  red: "border-red-400 bg-red-50 text-red-800 dark:bg-red-400/15 dark:text-red-200",
  zinc: "border-zinc-400 bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200",
} as const

function StateChip({
  label,
  lit,
  tone,
}: {
  label: string
  lit: boolean
  tone?: keyof typeof toneClass
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-500",
        lit
          ? cn(
              tone
                ? toneClass[tone]
                : "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
              "scale-105 shadow-md"
            )
          : "border-border bg-background text-muted-foreground"
      )}
    >
      {label}
    </span>
  )
}

function DataPanel({ live, reduced }: { live: boolean; reduced: boolean }) {
  const [tick] = useTicker(12, 1100, live && !reduced)
  // Each machine walks start → (middle) → one end, cycling through the ends.
  const reservationEnd = Math.floor(tick / 2) % 3
  const reservationLit = tick % 2 === 0 ? "start" : "end"
  const reportPhase = tick % 3
  const reportEnd = Math.floor(tick / 3) % 2

  return (
    <div className="space-y-6">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tables.map((table, index) => (
          <m.li
            key={table.name}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={live || reduced ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
          >
            <p className="flex items-center gap-2 font-mono text-sm font-bold text-pink-700 dark:text-pink-300">
              <IconDatabase size={15} aria-hidden="true" />
              {table.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{table.note}</p>
            <ul className="mt-3 space-y-1 font-mono text-[11px] text-foreground/80">
              {table.fields.map((field) => (
                <li key={field}>· {field}</li>
              ))}
            </ul>
            {table.links.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-1">
                {table.links.map((link) => (
                  <span
                    key={link}
                    className="rounded-full bg-pink-50 px-2 py-0.5 font-mono text-[10px] text-pink-700 dark:bg-pink-400/10 dark:text-pink-200"
                  >
                    → {link}
                  </span>
                ))}
              </p>
            )}
          </m.li>
        ))}
      </ul>

      <div className="grid gap-4 md:grid-cols-2">
        {machines.map((machine) => {
          const isReport = machine.middle !== null
          const endIndex = isReport ? reportEnd : reservationEnd
          const litStart = isReport
            ? reportPhase === 0
            : reservationLit === "start"
          const litMiddle = isReport && reportPhase === 1
          const litEnd = isReport ? reportPhase === 2 : reservationLit === "end"
          return (
            <div
              key={machine.title}
              className="rounded-2xl border border-border/70 bg-background p-4"
            >
              <p className="text-sm font-semibold">Status {machine.title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StateChip
                  label={machine.start.label}
                  lit={litStart || reduced}
                />
                <IconArrowRight
                  size={16}
                  className="text-muted-foreground"
                  aria-hidden="true"
                />
                {machine.middle && (
                  <>
                    <StateChip
                      label={machine.middle.label}
                      lit={litMiddle}
                      tone={undefined}
                    />
                    <IconArrowRight
                      size={16}
                      className="text-muted-foreground"
                      aria-hidden="true"
                    />
                  </>
                )}
                <span className="flex flex-wrap gap-1.5">
                  {machine.ends.map((end, index) => (
                    <StateChip
                      key={end.key}
                      label={end.label}
                      tone={end.tone}
                      lit={litEnd && index === endIndex}
                    />
                  ))}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <DocLink href="/docs/data-and-api">Baca data dan API</DocLink>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pengujian                                                           */
/* ------------------------------------------------------------------ */

const stats = [
  { value: 58, label: "Unit test", detail: "15 file Vitest" },
  { value: 37, label: "Test browser", detail: "Playwright, 5 file" },
  { value: 17, label: "User story", detail: "Semua punya video" },
]

const pipeline = [
  "Format",
  "Lint",
  "Typecheck",
  "Unit test",
  "Peers",
  "React Doctor",
  "Build",
]

function CountUp({ to, live }: { to: number; live: boolean }) {
  const [value, setValue] = useState(to)
  const started = useRef(false)
  useEffect(() => {
    if (!live || started.current) return
    started.current = true
    const controls = animate(0, to, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => setValue(Math.round(latest)),
    })
    return () => controls.stop()
  }, [live, to])
  return <>{value}</>
}

function StoryVideos() {
  const [selected, setSelected] = useState(storyVideos[0])
  const [autoplay, setAutoplay] = useState(false)

  return (
    <div>
      <p className="text-sm font-semibold">Video tiap user story</p>
      <div className="mt-2">
        <div className="aspect-video overflow-hidden rounded-2xl border border-border/70 bg-[#1c172f]">
          <iframe
            key={selected.youtube}
            src={`https://www.youtube-nocookie.com/embed/${selected.youtube}?rel=0${autoplay ? "&autoplay=1" : ""}`}
            title={`${selected.id}: ${selected.flow}`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{selected.id}</span> ·{" "}
          {selected.flow}
        </p>
      </div>
      <ul className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-9">
        {storyVideos.map((story) => {
          const active = story.id === selected.id
          return (
            <li key={story.id}>
              <button
                type="button"
                title={story.flow}
                aria-pressed={active}
                onClick={() => {
                  setSelected(story)
                  setAutoplay(true)
                }}
                className={cn(
                  "flex w-full items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors hover:border-pink-400 hover:text-pink-700 dark:hover:text-pink-300",
                  active
                    ? "border-pink-400 bg-pink-50 text-pink-800 dark:bg-pink-400/15 dark:text-pink-100"
                    : "border-border/70 bg-background"
                )}
              >
                ▶ {story.id}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function TestingPanel({
  live,
  reduced,
  qaSheetUrl,
}: {
  live: boolean
  reduced: boolean
  qaSheetUrl: string
}) {
  const [stage] = useTicker(pipeline.length + 3, 650, live && !reduced)
  const done = reduced ? pipeline.length : stage

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/70 bg-gradient-to-br from-white to-pink-50 p-5 dark:from-white/[0.04] dark:to-pink-500/10"
          >
            <p className="font-heading text-4xl font-bold text-pink-700 tabular-nums dark:text-pink-300">
              <CountUp to={stat.value} live={live && !reduced} />
            </p>
            <p className="mt-1 text-sm font-semibold">{stat.label}</p>
            <p className="text-xs text-muted-foreground">{stat.detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-background p-4">
        <p className="text-sm font-semibold">
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            pnpm check
          </code>{" "}
          sebelum setiap rilis
        </p>
        <ol
          className="mt-3 flex flex-wrap items-center gap-1.5"
          aria-label="Tahap pemeriksaan"
        >
          {pipeline.map((name, index) => {
            const complete = index < done
            const running = index === done
            return (
              <li key={name} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300",
                    complete
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                      : running
                        ? "border-pink-400 bg-pink-50 text-pink-800 dark:bg-pink-400/15 dark:text-pink-100"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {complete ? (
                    <IconCheck size={12} stroke={3} aria-hidden="true" />
                  ) : running ? (
                    <span className="size-2 animate-pulse rounded-full bg-pink-500" />
                  ) : null}
                  {name}
                </span>
                {index < pipeline.length - 1 && (
                  <span aria-hidden="true" className="h-px w-3 bg-border" />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      <StoryVideos />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <DocLink href="/docs/uat">Baca UAT</DocLink>
        <DocLink href="/docs/test-report">Laporan test</DocLink>
        <a
          href={qaSheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-700 dark:text-pink-300"
        >
          Log temuan QA
          <IconExternalLink size={15} aria-hidden="true" />
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Video direkam di demo statis lokal. Status “FIXED” di sheet QA tidak
        berarti sudah lulus retest atau tersedia di production.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Keamanan                                                            */
/* ------------------------------------------------------------------ */

const roles = ["Pengguna", "Petugas", "Admin"] as const

const permissions: { action: string; allow: [boolean, boolean, boolean] }[] = [
  { action: "Lihat fasilitas & slot", allow: [true, true, true] },
  {
    action: "Ajukan & batalkan reservasi sendiri",
    allow: [true, false, false],
  },
  { action: "Buat laporan + foto", allow: [true, false, false] },
  { action: "Setujui / tolak reservasi", allow: [false, true, true] },
  { action: "Tangani laporan", allow: [false, true, true] },
  { action: "Kelola fasilitas", allow: [false, false, true] },
  { action: "Verifikasi & kelola akun", allow: [false, false, true] },
  { action: "Rekap & ekspor CSV", allow: [false, false, true] },
]

const safeguards = [
  {
    icon: IconLock,
    title: "Cookie sesi HttpOnly",
    text: "Token sesi tidak bisa dibaca skrip halaman.",
  },
  {
    icon: IconUser,
    title: "Gerbang akun pending",
    text: "Pendaftaran baru tidak mendapat sesi sampai disetujui admin.",
  },
  {
    icon: IconShieldCheck,
    title: "Peran dicek di server",
    text: "Setiap fungsi Convex memeriksa peran; guard halaman bukan satu-satunya pengaman.",
  },
]

function SecurityPanel({ live, reduced }: { live: boolean; reduced: boolean }) {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">Hak akses per peran</caption>
          <thead>
            <tr className="border-b border-border/70 text-left">
              <th scope="col" className="p-3 font-semibold">
                Aksi
              </th>
              {roles.map((role) => (
                <th
                  key={role}
                  scope="col"
                  className="p-3 text-center font-semibold"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((row, rowIndex) => (
              <tr
                key={row.action}
                className="border-b border-border/50 last:border-0"
              >
                <th scope="row" className="p-3 text-left font-normal">
                  {row.action}
                </th>
                {row.allow.map((allowed, column) => (
                  <td key={roles[column]} className="p-3 text-center">
                    <m.span
                      className={cn(
                        "inline-grid size-7 place-items-center rounded-full",
                        allowed
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
                          : "text-muted-foreground/50"
                      )}
                      initial={reduced ? false : { scale: 0, opacity: 0 }}
                      animate={
                        live || reduced ? { scale: 1, opacity: 1 } : undefined
                      }
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                        delay: rowIndex * 0.06 + column * 0.03,
                      }}
                    >
                      {allowed ? (
                        <>
                          <IconCheck size={15} stroke={3} aria-hidden="true" />
                          <span className="sr-only">Boleh</span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Tidak</span>
                        </>
                      )}
                    </m.span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:grid-cols-3">
        {safeguards.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className="rounded-2xl border border-border/70 bg-background p-4"
          >
            <Icon
              size={20}
              className="text-pink-600 dark:text-pink-300"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {text}
            </p>
          </li>
        ))}
      </ul>
      <DocLink href="/docs/security-privacy">Baca catatan keamanan</DocLink>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Explorer                                                            */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Alur logika                                                         */
/* ------------------------------------------------------------------ */

/**
 * Every diagram from docs/FLOWS.md, one at a time, grouped by topic, with
 * previous/next for walking through them in a presentation.
 */
function FlowsPanel({ flows, active }: { flows: FlowDoc[]; active: boolean }) {
  const [index, setIndex] = useState(0)
  const flow = flows[index]
  const groups = flows.reduce<{ name: string; items: number[] }[]>(
    (list, item, position) => {
      const last = list.at(-1)
      if (last?.name === item.group) last.items.push(position)
      else list.push({ name: item.group, items: [position] })
      return list
    },
    []
  )
  if (!flow) return null

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <nav aria-label="Daftar alur" className="space-y-4">
        {groups.map((group) => (
          <div key={group.name}>
            <p className="mb-1.5 text-[11px] font-bold tracking-[0.12em] text-pink-700 uppercase dark:text-pink-300">
              {group.name}
            </p>
            <ul className="flex flex-wrap gap-1.5 lg:flex-col">
              {group.items.map((position) => {
                const item = flows[position]!
                const selected = position === index
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setIndex(position)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-1.5 text-left text-xs font-semibold transition-colors",
                        selected
                          ? "border-pink-400 bg-pink-50 text-pink-800 dark:bg-pink-400/15 dark:text-pink-100"
                          : "border-border/70 bg-background hover:border-pink-300 hover:text-pink-700 dark:hover:text-pink-300"
                      )}
                    >
                      {item.title}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <section aria-live="polite" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-muted-foreground">
              {flow.group} · {index + 1}/{flows.length}
            </p>
            <h3 className="mt-1 font-heading text-xl font-bold">
              {flow.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {flow.summary}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label="Alur sebelumnya"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
              className="rounded-full border border-border/70 p-2 transition-colors hover:border-pink-400 disabled:opacity-40"
            >
              <IconArrowLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Alur berikutnya"
              disabled={index === flows.length - 1}
              onClick={() => setIndex(index + 1)}
              className="rounded-full border border-border/70 p-2 transition-colors hover:border-pink-400 disabled:opacity-40"
            >
              <IconArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        {active && (
          <MermaidDiagram
            key={flow.id}
            chart={flow.chart}
            label={`Diagram: ${flow.title}`}
          />
        )}
        {flow.points.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {flow.points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm">
                <IconCheck
                  size={16}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
        <DocLink href="/docs/flows">Buka semua alur dalam satu halaman</DocLink>
      </section>
    </div>
  )
}

export function DocsExplorer({
  qaSheetUrl,
  flows,
}: {
  qaSheetUrl: string
  flows: FlowDoc[]
}) {
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, { amount: 0.25 })
  const reduced = Boolean(useReducedMotion())
  const [active, setActive] = useState<TabKey>("arsitektur")
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = (index + delta + tabs.length) % tabs.length
    const tab = tabs[next]
    if (!tab) return
    setActive(tab.key)
    buttons.current[next]?.focus()
  }

  const panels: Record<TabKey, ReactNode> = {
    arsitektur: (
      <ArchitecturePanel
        live={inView && active === "arsitektur"}
        reduced={reduced}
      />
    ),
    data: <DataPanel live={inView && active === "data"} reduced={reduced} />,
    pengujian: (
      <TestingPanel
        live={inView && active === "pengujian"}
        reduced={reduced}
        qaSheetUrl={qaSheetUrl}
      />
    ),
    keamanan: (
      <SecurityPanel live={inView && active === "keamanan"} reduced={reduced} />
    ),
    alur: <FlowsPanel flows={flows} active={active === "alur"} />,
  }

  return (
    <LazyMotion features={domMax} strict>
      <div
        ref={root}
        className="overflow-hidden rounded-[28px] border border-pink-100 bg-white shadow-[0_24px_60px_-30px_rgba(208,0,100,0.35)] dark:border-white/10 dark:bg-[#211a24]"
      >
        <div
          role="tablist"
          aria-label="Topik dokumentasi"
          className="grid grid-cols-2 gap-1 border-b border-pink-100 bg-pink-50/50 p-2 sm:grid-cols-3 lg:grid-cols-5 dark:border-white/10 dark:bg-white/[0.02]"
        >
          {tabs.map((tab, index) => {
            const selected = active === tab.key
            return (
              <button
                key={tab.key}
                ref={(node) => {
                  buttons.current[index] = node
                }}
                id={`docs-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`docs-panel-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.key)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "relative rounded-2xl px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:outline-none",
                  selected
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/[0.04]"
                )}
              >
                {selected && (
                  <m.span
                    layoutId={reduced ? undefined : "docs-tab-pill"}
                    className="absolute inset-0 rounded-2xl bg-white shadow-sm ring-1 ring-pink-200 dark:bg-white/[0.07] dark:ring-pink-400/30"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative block text-sm font-semibold">
                  {tab.label}
                </span>
                <span className="relative block text-xs">{tab.hint}</span>
              </button>
            )
          })}
        </div>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            id={`docs-panel-${tab.key}`}
            role="tabpanel"
            aria-labelledby={`docs-tab-${tab.key}`}
            hidden={active !== tab.key}
            className="p-4 sm:p-7"
          >
            {panels[tab.key]}
          </div>
        ))}
      </div>
    </LazyMotion>
  )
}
