"use client"

import { useEffect, useRef, useState } from "react"
import {
  IconCalendarEvent,
  IconCheck,
  IconSearch,
  IconTool,
} from "@tabler/icons-react"

export type StepKey = "search" | "reserve" | "approve" | "report"

export type Step = { key: StepKey; title: string; text: string }

const icons = {
  search: IconSearch,
  reserve: IconCalendarEvent,
  approve: IconCheck,
  report: IconTool,
} satisfies Record<StepKey, typeof IconSearch>

type StepsDemoComponent = typeof import("./steps-demo").StepsDemo

function StageSkeleton() {
  return (
    <div className="steps-window steps-window-skeleton">
      <div className="steps-window-bar">
        <i />
        <i />
        <i />
        <span />
      </div>
    </div>
  )
}

export function StepsShowcase({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [near, setNear] = useState(false)
  // Decorative cursor demo. A plain import() (not next/dynamic, which Next
  // preloads in the HTML) keeps its chunk off the network until the section
  // nears the viewport.
  const [StepsDemo, setStepsDemo] = useState<StepsDemoComponent | null>(null)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pageHidden, setPageHidden] = useState(false)

  useEffect(() => {
    const node = root.current
    if (!node || !("IntersectionObserver" in window)) {
      setNear(true)
      setVisible(true)
      return
    }
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true)
          nearObserver.disconnect()
        }
      },
      { rootMargin: "300px 0px" }
    )
    const visibleObserver = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.35 }
    )
    nearObserver.observe(node)
    visibleObserver.observe(node)
    const onVisibility = () => setPageHidden(document.hidden)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      nearObserver.disconnect()
      visibleObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!near) return
    let live = true
    // If the chunk fails the skeleton stays; the step text is unaffected.
    import("./steps-demo").then(
      (mod) => {
        if (live) setStepsDemo(() => mod.StepsDemo)
      },
      () => undefined
    )
    return () => {
      live = false
    }
  }, [near])

  const paused = !visible || hovered || pageHidden

  return (
    <div
      ref={root}
      className="steps-showcase"
      data-paused={paused ? "" : undefined}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setHovered(false)
      }}
    >
      <ol className="steps-list">
        {steps.map(({ key, title, text }, i) => {
          const Icon = icons[key]
          const isActive = i === active
          return (
            <li
              key={key}
              className="steps-item"
              data-active={isActive ? "" : undefined}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="feature-icon">
                <Icon size={24} stroke={1.7} aria-hidden="true" />
              </span>
              <div className="steps-item-copy">
                <span className="step-number">0{i + 1}</span>
                <h3>
                  <button type="button" onClick={() => setActive(i)}>
                    {title}
                  </button>
                </h3>
                <p>{text}</p>
              </div>
              {isActive && (
                <span
                  key={active}
                  className="steps-progress"
                  aria-hidden="true"
                  onAnimationEnd={() =>
                    setActive((current) => (current + 1) % steps.length)
                  }
                />
              )}
            </li>
          )
        })}
      </ol>
      <div className="steps-stage" aria-hidden="true">
        {StepsDemo ? (
          <StepsDemo step={steps[active]?.key ?? "search"} paused={paused} />
        ) : (
          <StageSkeleton />
        )}
      </div>
    </div>
  )
}
