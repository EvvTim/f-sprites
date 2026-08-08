import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { CheckIcon } from "lucide-react"

import {
  VARIANT_LABELS,
  getSpriteImage,
  spriteBackgroundStyle,
  spriteCardStyle,
  toneBadgeStyle,
} from "@/data/sprites"
import type { Sprite } from "@/data/types"
import { haptics } from "@/lib/haptics"
import { cn } from "@/lib/utils"

type SpriteCardProps = {
  sprite: Sprite
  owned: boolean
  onOpen: () => void
  onToggleOwned: () => void
}

const LONG_PRESS_MS = 450
const LONG_PRESS_MOVE_TOLERANCE_PX = 10

export function SpriteCard({
  sprite,
  owned,
  onOpen,
  onToggleOwned,
}: SpriteCardProps) {
  const [pressing, setPressing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const longPressFiredRef = useRef(false)

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    originRef.current = null
    setPressing(false)
  }

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    originRef.current = { x: e.clientX, y: e.clientY }
    longPressFiredRef.current = false
    setPressing(true)
    timerRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      setPressing(false)
      haptics.tap()
      onToggleOwned()
    }, LONG_PRESS_MS)
  }

  const handlePointerMove = (e: ReactPointerEvent) => {
    const origin = originRef.current
    if (!origin) return
    if (
      Math.abs(e.clientX - origin.x) > LONG_PRESS_MOVE_TOLERANCE_PX ||
      Math.abs(e.clientY - origin.y) > LONG_PRESS_MOVE_TOLERANCE_PX
    ) {
      cancelPress()
    }
  }

  const handleClick = () => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    haptics.tap()
    onOpen()
  }

  return (
    <li
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border-2 bg-card transition-all",
        !owned && "active:border-foreground/25"
      )}
      style={spriteCardStyle(sprite, owned)}
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        className="flex flex-1 flex-col items-center gap-1.5 p-2.5 text-left outline-none [-webkit-touch-callout:none] select-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div
          className={cn(
            "relative flex aspect-square w-full items-center justify-center rounded-lg bg-muted/50 transition-transform duration-150",
            sprite.unreleased && "opacity-50 grayscale",
            !owned && !sprite.unreleased && "opacity-80",
            pressing && "scale-[0.94]"
          )}
          style={spriteBackgroundStyle(sprite)}
        >
          <img
            src={getSpriteImage(sprite)}
            alt={sprite.name}
            loading="lazy"
            className="size-4/5 object-contain"
          />
        </div>
        <div className="w-full">
          <p className="truncate text-xs leading-tight font-medium">
            {sprite.name}
          </p>
          <span
            className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] leading-none font-medium"
            style={toneBadgeStyle(sprite.rarity)}
          >
            {VARIANT_LABELS[sprite.variant]}
          </span>
        </div>
      </button>

      {owned && (
        <span className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-500 text-white shadow-sm">
          <CheckIcon className="size-3.5" strokeWidth={3} />
        </span>
      )}
    </li>
  )
}
