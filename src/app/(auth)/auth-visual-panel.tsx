"use client"

import { useState } from "react"
import { IconInfoCircle, IconX } from "@tabler/icons-react"

import { LiveOrb } from "@/components/ui/live-orb"
import { FeatureCarousel } from "./feature-carousel"

const liveOrbColors = ["#f062aa", "#fff5fa", "#ffacd5"]

export function AuthVisualPanel() {
  const [showInfo, setShowInfo] = useState(false)
  const [introConsumed, setIntroConsumed] = useState(false)

  return (
    <aside className="login-gradient-flow relative hidden h-full flex-1 items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#d00064_0%,#82003e_50%,#43001c_100%)] text-white lg:flex">
      <div
        className="login-gradient-drift absolute -right-32 -bottom-32 size-[620px] rounded-full bg-pink-300/25 blur-[100px]"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => {
          setIntroConsumed(true)
          setShowInfo((current) => !current)
        }}
        aria-label={showInfo ? "Kembali ke orb" : "Lihat fitur Sthana Kampus"}
        aria-pressed={showInfo}
        title={showInfo ? "Kembali ke orb" : "Lihat fitur"}
        className="absolute top-7 right-7 z-20 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/10 text-white/75 backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        {showInfo ? (
          <IconX size={17} aria-hidden="true" />
        ) : (
          <IconInfoCircle size={18} aria-hidden="true" />
        )}
      </button>

      <div
        key={showInfo ? "carousel" : "orb"}
        className="login-panel-swap relative z-10 flex size-full items-center justify-center"
      >
        {showInfo ? (
          <FeatureCarousel />
        ) : (
          <div className="login-orb-scene" data-intro={!introConsumed}>
            <div className="login-orb-halo" aria-hidden="true" />
            <div className="login-orb-entrance">
              <div className="login-orb-float">
                <LiveOrb
                  size={360}
                  variant="webgl"
                  appearance="luminous"
                  colors={liveOrbColors}
                />
              </div>
            </div>
            <div className="login-orb-shadow" aria-hidden="true">
              <div />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
