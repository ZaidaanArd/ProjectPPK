"use client"

import { useEffect, useRef, useState } from "react"
import { IconListDetails, IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

type TocItem = {
  id: string
  text: string
  level: 2 | 3
  snippet: string
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "bagian"
  )
}

/** The first paragraph after a heading, for the hover preview. */
function snippetFor(heading: HTMLElement) {
  let node = heading.nextElementSibling
  for (let step = 0; node && step < 4; step += 1) {
    if (node.matches("h2, h3")) break
    const paragraph = node.matches("p") ? node : node.querySelector("p")
    if (paragraph?.textContent?.trim()) return paragraph.textContent.trim()
    node = node.nextElementSibling
  }
  const sibling = heading.parentElement?.querySelector(":scope > p")
  return sibling?.textContent?.trim() ?? ""
}

function collect(selector: string): TocItem[] {
  const used = new Set<string>()
  return [...document.querySelectorAll<HTMLElement>(selector)]
    .filter((heading) => heading.textContent?.trim())
    .map((heading) => {
      if (!heading.id) {
        let id = slugify(heading.textContent ?? "")
        while (used.has(id) || document.getElementById(id)) id += "-1"
        heading.id = id
      }
      used.add(heading.id)
      heading.style.scrollMarginTop ||= "96px"
      return {
        id: heading.id,
        text: heading.textContent!.trim(),
        level: heading.tagName === "H3" ? 3 : 2,
        snippet: snippetFor(heading),
      }
    })
}

// Tick widths in px: compact at rest, magnified by distance from the pointer.
const REST_WIDTH = 7
const magnified = [24, 15, 11, 9]

function jumpTo(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
  history.replaceState(null, "", `#${id}`)
}

/**
 * A ChatGPT-style table of contents for long pages: a rail of ticks at the
 * left edge, one per heading, with the current section highlighted as you
 * scroll. Hovering or focusing a tick previews that section; clicking jumps
 * to it. On narrow screens it becomes a "Daftar isi" button.
 */
export function ScrollspyToc({
  selector,
  label = "Daftar isi",
}: {
  selector: string
  label?: string
}) {
  const [items, setItems] = useState<TocItem[]>([])
  const [active, setActive] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const found = collect(selector)
    // Headings are server-rendered, so one read after mount is enough.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(found)
    if (found.length === 0) return

    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.3
      let current = found[0]!.id
      for (const item of found) {
        const top = document
          .getElementById(item.id)
          ?.getBoundingClientRect().top
        if (top !== undefined && top <= line) current = item.id
      }
      // At the very bottom the last section counts as read.
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      ) {
        current = found.at(-1)!.id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [selector])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (items.length < 3) return null
  const hovered = items.findIndex((item) => item.id === preview)

  return (
    <>
      <nav
        aria-label={label}
        className="scrollspy-rail group/rail fixed top-1/2 left-3 z-30 hidden -translate-y-1/2 lg:block"
      >
        <ol className="flex flex-col">
          {items.map((item, index) => {
            const current = item.id === active
            const shown = index === hovered
            // Dock-style magnification: ticks near the pointer stretch out.
            const distance = hovered < 0 ? Infinity : Math.abs(index - hovered)
            const width = magnified[distance] ?? REST_WIDTH
            return (
              <li key={item.id} className="relative">
                <button
                  type="button"
                  aria-label={item.text}
                  aria-current={current ? "location" : undefined}
                  onClick={() => jumpTo(item.id)}
                  onMouseEnter={() => setPreview(item.id)}
                  onMouseLeave={() => setPreview(null)}
                  onFocus={() => setPreview(item.id)}
                  onBlur={() => setPreview(null)}
                  className="flex h-2.5 w-8 items-center focus-visible:outline-none"
                >
                  <span
                    style={{ width }}
                    className={cn(
                      "block h-[1.5px] rounded-full transition-[width,background-color,opacity] duration-200 ease-out motion-reduce:transition-none",
                      current || shown
                        ? "bg-foreground"
                        : distance <= 2
                          ? "bg-foreground/55"
                          : "bg-muted-foreground/40 group-hover/rail:bg-muted-foreground/55"
                    )}
                  />
                </button>
                {shown && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute top-1/2 left-10 w-72 -translate-y-1/2 animate-in rounded-2xl border border-border/80 bg-popover/95 p-3.5 text-popover-foreground shadow-xl backdrop-blur duration-150 fade-in-0 slide-in-from-left-1"
                  >
                    <p className="line-clamp-2 text-sm font-semibold">
                      {item.text}
                    </p>
                    {item.snippet && (
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                        {item.snippet}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      <div ref={panel} className="fixed bottom-4 left-4 z-40 lg:hidden">
        {open && (
          <nav
            aria-label={label}
            className="mb-2 max-h-[60vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border/80 bg-popover p-2 text-popover-foreground shadow-xl"
          >
            <ol>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={item.id === active ? "location" : undefined}
                    onClick={() => {
                      setOpen(false)
                      jumpTo(item.id)
                    }}
                    className={cn(
                      "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      item.level === 3 && "pl-6 text-xs",
                      item.id === active &&
                        "bg-pink-50 font-semibold text-pink-800 dark:bg-pink-400/15 dark:text-pink-100"
                    )}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-2 rounded-full border border-border/80 bg-popover px-4 py-2 text-sm font-semibold text-popover-foreground shadow-lg"
        >
          {open ? (
            <IconX size={16} aria-hidden="true" />
          ) : (
            <IconListDetails size={16} aria-hidden="true" />
          )}
          {label}
        </button>
      </div>
    </>
  )
}
