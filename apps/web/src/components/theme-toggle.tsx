import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"

import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const dark = theme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={dark ? "Gunakan tema terang" : "Gunakan tema gelap"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <HugeiconsIcon icon={dark ? Sun03Icon : Moon02Icon} size={18} />
    </Button>
  )
}
