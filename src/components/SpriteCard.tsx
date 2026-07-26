import { CheckIcon } from "lucide-react"

import { RARITY_COLORS, VARIANT_LABELS, getSpriteImage } from "@/data/sprites"
import type { Sprite } from "@/data/types"
import { cn } from "@/lib/utils"

type SpriteCardProps = {
  sprite: Sprite
  owned: boolean
  onToggleOwned: () => void
  onOpen: () => void
}

export function SpriteCard({
  sprite,
  owned,
  onToggleOwned,
  onOpen,
}: SpriteCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border transition-all",
        owned
          ? "border-emerald-500/40 bg-emerald-500/[0.07] shadow-[0_0_0_1px] shadow-emerald-500/30 dark:bg-emerald-500/10"
          : "border-border bg-card active:border-foreground/25"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col items-center gap-1.5 p-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div
          className={cn(
            "relative flex aspect-square w-full items-center justify-center rounded-lg bg-muted/50",
            sprite.unreleased && "opacity-50 grayscale",
            !owned && !sprite.unreleased && "opacity-80"
          )}
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
            className={cn(
              "mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] leading-none font-medium",
              RARITY_COLORS[sprite.rarity]
            )}
          >
            {VARIANT_LABELS[sprite.variant]}
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={onToggleOwned}
        aria-pressed={owned}
        aria-label={owned ? "Mark as not owned" : "Mark as owned"}
        className={cn(
          "absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full border-2 transition-all active:scale-90",
          owned
            ? "border-emerald-600 bg-emerald-500 text-white shadow-sm"
            : "border-border/80 bg-background/90 text-transparent backdrop-blur-sm hover:border-foreground/30 hover:text-muted-foreground/60"
        )}
      >
        <CheckIcon className="size-4" strokeWidth={3} />
      </button>
    </div>
  )
}
