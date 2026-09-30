"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  AnimatePresence,
  LazyMotion,
  domMax,
  m,
  useReducedMotion,
} from "motion/react"
import {
  IconCalendarEvent,
  IconCamera,
  IconCircleCheck,
  IconClockHour4,
  IconMapPin,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react"

import type { StepKey } from "./steps-showcase"

type DemoState = {
  query: string
  picked: boolean
  day: number | null
  slot: string | null
  purpose: string
  sent: boolean
  status: "pending" | "review" | "approved"
  category: string | null
  note: string
  photo: boolean
  reported: boolean
  pressed: string | null
  toast: { title: string; text: string } | null
}

type Action =
  | { move: string; ms: number }
  | { click: string; patch?: Partial<DemoState> }
  | { type: "query" | "purpose" | "note"; text: string; ms: number }
  | { patch: Partial<DemoState> }
  | { wait: number }

const initialState: DemoState = {
  query: "",
  picked: false,
  day: null,
  slot: null,
  purpose: "",
  sent: false,
  status: "pending",
  category: null,
  note: "",
  photo: false,
  reported: false,
  pressed: null,
  toast: null,
}

// Each scene fits inside the 7s progress bar in steps-showcase (CSS).
const scenes: Record<StepKey, Action[]> = {
  search: [
    { wait: 400 },
    { move: "search", ms: 700 },
    { click: "search" },
    { type: "query", text: "Aula", ms: 110 },
    { wait: 350 },
    { move: "row-aula", ms: 650 },
    { click: "row-aula", patch: { picked: true } },
    { wait: 1600 },
  ],
  reserve: [
    { wait: 300 },
    { move: "day-3", ms: 600 },
    { click: "day-3", patch: { day: 3 } },
    { move: "slot-10", ms: 500 },
    { click: "slot-10", patch: { slot: "10.00" } },
    { move: "purpose", ms: 450 },
    { click: "purpose" },
    { type: "purpose", text: "Seminar himpunan", ms: 55 },
    { move: "submit", ms: 500 },
    {
      click: "submit",
      patch: {
        sent: true,
        toast: {
          title: "Reservasi terkirim",
          text: "Menunggu persetujuan petugas",
        },
      },
    },
    { wait: 1200 },
  ],
  approve: [
    { wait: 300 },
    { move: "card", ms: 700 },
    { wait: 500 },
    { patch: { status: "review" } },
    { wait: 900 },
    {
      patch: {
        status: "approved",
        toast: {
          title: "Reservasi disetujui",
          text: "Aula Gedung A · Rabu, 10.00",
        },
      },
    },
    { move: "badge", ms: 500 },
    { wait: 1500 },
  ],
  report: [
    { wait: 300 },
    { move: "chip-ac", ms: 600 },
    { click: "chip-ac", patch: { category: "AC" } },
    { move: "note", ms: 450 },
    { click: "note" },
    { type: "note", text: "AC tidak dingin", ms: 55 },
    { move: "photo", ms: 450 },
    { click: "photo", patch: { photo: true } },
    { move: "send", ms: 500 },
    {
      click: "send",
      patch: {
        reported: true,
        toast: {
          title: "Laporan terkirim",
          text: "Petugas akan menindaklanjuti",
        },
      },
    },
    { wait: 1200 },
  ],
}

const paths: Record<StepKey, string> = {
  search: "sthana.myudak.com/facilities",
  reserve: "sthana.myudak.com/app/reservations/new",
  approve: "sthana.myudak.com/app/reservations",
  report: "sthana.myudak.com/app/reports/new",
}

type CursorState = { x: number; y: number; ms: number; clicks: number }

type SceneIO = {
  sleep: (ms: number) => Promise<void>
  pointAt: (target: string) => { x: number; y: number } | null
  update: (patch: (s: DemoState) => DemoState) => void
  moveCursor: (patch: (c: CursorState) => CursorState) => void
}

async function playScene(actions: Action[], io: SceneIO) {
  for (const action of actions) {
    if ("wait" in action) {
      await io.sleep(action.wait)
    } else if ("move" in action) {
      const point = io.pointAt(action.move)
      if (point) io.moveCursor((c) => ({ ...c, ...point, ms: action.ms }))
      await io.sleep(action.ms)
    } else if ("click" in action) {
      io.moveCursor((c) => ({ ...c, clicks: c.clicks + 1 }))
      io.update((s) => ({ ...s, pressed: action.click }))
      await io.sleep(160)
      io.update((s) => ({ ...s, ...action.patch, pressed: null }))
      await io.sleep(120)
    } else if ("type" in action) {
      for (let i = 1; i <= action.text.length; i++) {
        const text = action.text.slice(0, i)
        io.update((s) => ({ ...s, [action.type]: text }))
        await io.sleep(action.ms)
      }
    } else {
      io.update((s) => ({ ...s, ...action.patch }))
    }
  }
}

function finalState(step: StepKey): DemoState {
  let state = initialState
  for (const action of scenes[step]) {
    if ("patch" in action && action.patch) state = { ...state, ...action.patch }
    if ("type" in action) state = { ...state, [action.type]: action.text }
  }
  return state
}

export function StepsDemo({
  step,
  paused,
}: {
  step: StepKey
  paused: boolean
}) {
  const reduced = Boolean(useReducedMotion())
  return (
    <LazyMotion features={domMax} strict>
      <div className="steps-window">
        <div className="steps-window-bar">
          <i />
          <i />
          <i />
          <span>{paths[step]}</span>
        </div>
        <Scene
          key={`${step}-${reduced}`}
          step={step}
          paused={paused}
          reduced={reduced}
        />
      </div>
    </LazyMotion>
  )
}

function Scene({
  step,
  paused,
  reduced,
}: {
  step: StepKey
  paused: boolean
  reduced: boolean
}) {
  const canvas = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  const [state, setState] = useState<DemoState>(() =>
    reduced ? finalState(step) : initialState
  )
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    ms: 0,
    clicks: 0,
  })

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (reduced) return
    let cancelled = false
    const sleep = async (ms: number) => {
      let left = ms
      while (left > 0) {
        if (cancelled) throw new Error("cancelled")
        await new Promise((resolve) => window.setTimeout(resolve, 40))
        if (!pausedRef.current) left -= 40
      }
    }
    const pointAt = (target: string) => {
      const box = canvas.current
      const node = box?.querySelector<HTMLElement>(`[data-t="${target}"]`)
      if (!box || !node) return null
      const outer = box.getBoundingClientRect()
      const rect = node.getBoundingClientRect()
      return {
        x: rect.left - outer.left + Math.min(rect.width * 0.5, 60),
        y: rect.top - outer.top + rect.height * 0.55,
      }
    }

    const update = (patch: (s: DemoState) => DemoState) => {
      if (!cancelled) setState(patch)
    }
    const moveCursor = (patch: (c: CursorState) => CursorState) => {
      if (!cancelled) setCursor(patch)
    }
    const box = canvas.current?.getBoundingClientRect()
    if (box)
      moveCursor(() => ({
        x: box.width * 0.72,
        y: box.height * 0.9,
        ms: 0,
        clicks: 0,
      }))

    playScene(scenes[step], { sleep, pointAt, update, moveCursor }).catch(
      () => undefined
    )
    return () => {
      cancelled = true
    }
  }, [step, reduced])

  return (
    <div ref={canvas} className="steps-canvas" data-step={step}>
      {step === "search" && <SearchScene state={state} />}
      {step === "reserve" && <ReserveScene state={state} />}
      {step === "approve" && <ApproveScene state={state} />}
      {step === "report" && <ReportScene state={state} />}

      <AnimatePresence>
        {state.toast && (
          <m.div
            className="sd-toast"
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <IconCircleCheck size={16} />
            <span>
              <b>{state.toast.title}</b>
              {state.toast.text}
            </span>
          </m.div>
        )}
      </AnimatePresence>

      {!reduced && (
        <m.div
          className="sd-cursor"
          initial={false}
          animate={{ x: cursor.x, y: cursor.y }}
          transition={{
            duration: cursor.ms / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <m.span
            key={cursor.clicks}
            className="sd-ripple"
            initial={{ scale: 0.2, opacity: cursor.clicks ? 0.55 : 0 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <m.svg
            key={`arrow-${cursor.clicks}`}
            viewBox="0 0 24 24"
            width="22"
            height="22"
            initial={{ scale: cursor.clicks ? 0.82 : 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <path
              d="M4 2.5 19.5 12l-7 1.6L9 20.5z"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </m.svg>
        </m.div>
      )}
    </div>
  )
}

function Press({
  id,
  state,
  className,
  children,
  active,
}: {
  id: string
  state: DemoState
  className: string
  children: ReactNode
  active?: boolean
}) {
  return (
    <div
      data-t={id}
      className={className}
      data-pressed={state.pressed === id ? "" : undefined}
      data-on={active ? "" : undefined}
    >
      {children}
    </div>
  )
}

const facilities = [
  { name: "Aula Gedung A", place: "Gedung A · Lt. 2", people: 300 },
  { name: "Lab Komputer 3", place: "Gedung Informatika", people: 40 },
  { name: "Ruang Seminar 2", place: "Gedung Kuliah Bersama", people: 60 },
  { name: "Lapangan Basket", place: "Sport Center", people: 50 },
]

function SearchScene({ state }: { state: DemoState }) {
  const query = state.query.toLowerCase()
  const rows = facilities.filter((f) => f.name.toLowerCase().includes(query))
  return (
    <div className="sd-body">
      <Press
        id="search"
        state={state}
        className="sd-input"
        active={state.query.length > 0}
      >
        <IconSearch size={14} />
        {state.query ? (
          <span>
            {state.query}
            <i className="sd-caret" />
          </span>
        ) : (
          <em>Cari nama, jenis, atau lokasi</em>
        )}
      </Press>
      <div className="sd-list">
        <AnimatePresence initial={false}>
          {rows.map((f) => (
            <m.div
              key={f.name}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Press
                id={f.name === "Aula Gedung A" ? "row-aula" : f.name}
                state={state}
                className="sd-row"
                active={state.picked && f.name === "Aula Gedung A"}
              >
                <span className="sd-thumb" />
                <span className="sd-row-copy">
                  <b>{f.name}</b>
                  <small>
                    <IconMapPin size={11} /> {f.place}
                  </small>
                </span>
                <span className="sd-meta">
                  <IconUsers size={11} /> {f.people}
                </span>
              </Press>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {state.picked && (
          <m.div
            className="sd-detail-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <span className="sd-detail">
              <span className="sd-dot" /> Tersedia hari ini · 24 slot kosong
            </span>
            <div className="sd-availability">
              {availability.map(({ hour, open }, i) => (
                <m.i
                  key={hour}
                  data-open={open ? "" : undefined}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                />
              ))}
            </div>
            <small>07.00 — 20.00 WIB</small>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const availability = [1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1].map((open, i) => ({
  hour: 7 + i,
  open: Boolean(open),
}))

const days = ["Sen", "Sel", "Rab", "Kam", "Jum"]
const slots = [
  { time: "08.00", taken: true },
  { time: "09.00", taken: true },
  { time: "10.00", taken: false },
  { time: "11.00", taken: false },
  { time: "13.00", taken: false },
  { time: "14.00", taken: false },
]

function ReserveScene({ state }: { state: DemoState }) {
  return (
    <div className="sd-body">
      <div className="sd-heading">
        <IconCalendarEvent size={14} /> Aula Gedung A
      </div>
      <div className="sd-days">
        {days.map((day, i) => (
          <Press
            key={day}
            id={`day-${i + 1}`}
            state={state}
            className="sd-day"
            active={state.day === i + 1}
          >
            <small>{day}</small>
            <b>{i + 5}</b>
          </Press>
        ))}
      </div>
      <div className="sd-slots">
        {slots.map(({ time, taken }) => (
          <Press
            key={time}
            id={`slot-${time.slice(0, 2)}`}
            state={state}
            className={taken ? "sd-slot sd-slot-taken" : "sd-slot"}
            active={state.slot === time}
          >
            {time}
          </Press>
        ))}
      </div>
      <Press
        id="purpose"
        state={state}
        className="sd-input"
        active={state.purpose.length > 0}
      >
        {state.purpose ? (
          <span>
            {state.purpose}
            {!state.sent && <i className="sd-caret" />}
          </span>
        ) : (
          <em>Tujuan penggunaan</em>
        )}
      </Press>
      <Press
        id="submit"
        state={state}
        className="sd-button"
        active={state.sent}
      >
        {state.sent ? "Terkirim ✓" : "Kirim reservasi"}
      </Press>
    </div>
  )
}

const statusLabel = {
  pending: "Menunggu",
  review: "Ditinjau",
  approved: "Disetujui",
} as const

function ApproveScene({ state }: { state: DemoState }) {
  const order = ["pending", "review", "approved"] as const
  const reached = order.indexOf(state.status)
  const approved = state.status === "approved"
  return (
    <div className="sd-body">
      <div className="sd-tabs">
        <span data-on={approved ? undefined : ""}>Menunggu</span>
        <span data-on={approved ? "" : undefined}>Disetujui</span>
        <span>Riwayat</span>
      </div>
      <Press
        id="card"
        state={state}
        className="sd-card"
        active={state.status === "approved"}
      >
        <span className="sd-row-copy">
          <b>Aula Gedung A</b>
          <small>
            <IconClockHour4 size={11} /> Rab, 10.00–11.00 · Seminar himpunan
          </small>
        </span>
        <span data-t="badge" className="sd-badge" data-status={state.status}>
          {statusLabel[state.status]}
        </span>
      </Press>
      <ol className="sd-timeline">
        {["Diajukan", "Ditinjau petugas", "Disetujui"].map((label, i) => (
          <li key={label} data-done={i <= reached ? "" : undefined}>
            <span className="sd-node">
              {i < reached || state.status === "approved" ? "✓" : ""}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <div className="sd-card sd-card-muted">
        <span className="sd-row-copy">
          <b>Lab Komputer 3</b>
          <small>
            <IconClockHour4 size={11} /> Kam, 13.00–14.00 · Praktikum
          </small>
        </span>
        <span className="sd-badge" data-status="approved">
          Disetujui
        </span>
      </div>
    </div>
  )
}

const categories = ["AC", "Proyektor", "Kursi", "Kebersihan"]

function ReportScene({ state }: { state: DemoState }) {
  return (
    <div className="sd-body">
      <div className="sd-heading">
        <IconMapPin size={14} /> Aula Gedung A
      </div>
      <div className="sd-chips">
        {categories.map((category) => (
          <Press
            key={category}
            id={`chip-${category.toLowerCase()}`}
            state={state}
            className="sd-chip"
            active={state.category === category}
          >
            {category}
          </Press>
        ))}
      </div>
      <Press
        id="note"
        state={state}
        className="sd-input sd-textarea"
        active={state.note.length > 0}
      >
        {state.note ? (
          <span>
            {state.note}
            {!state.reported && <i className="sd-caret" />}
          </span>
        ) : (
          <em>Jelaskan kendalanya</em>
        )}
      </Press>
      <div className="sd-report-actions">
        <Press
          id="photo"
          state={state}
          className="sd-photo"
          active={state.photo}
        >
          {state.photo ? <span className="sd-photo-thumb" /> : null}
          <IconCamera size={14} />
          {state.photo ? "foto-ac.jpg" : "Tambah foto"}
        </Press>
        <Press
          id="send"
          state={state}
          className="sd-button"
          active={state.reported}
        >
          {state.reported ? "Terkirim ✓" : "Kirim laporan"}
        </Press>
      </div>
    </div>
  )
}
