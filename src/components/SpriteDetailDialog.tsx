import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  RARITY_COLORS,
  RARITY_LABELS,
  VARIANT_COLORS,
  VARIANT_LABELS,
  getSpriteImage,
  sortByVariant,
  sprites,
} from "@/data/sprites"
import type { Sprite } from "@/data/types"
import { useCollectionStore } from "@/store/useCollectionStore"
import { cn } from "@/lib/utils"

type SpriteDetailDialogProps = {
  sprite: Sprite | null
  onOpenChange: (open: boolean) => void
  onSelect: (sprite: Sprite) => void
  onToggleOwned: (sprite: Sprite) => void
}

export function SpriteDetailDialog({
  sprite,
  onOpenChange,
  onSelect,
  onToggleOwned,
}: SpriteDetailDialogProps) {
  const owned = useCollectionStore((s) =>
    sprite ? s.isOwned(sprite.id) : false
  )

  const siblings = sprite
    ? sprites.filter((s) => s.parent === sprite.parent).sort(sortByVariant)
    : []

  return (
    <Sheet open={sprite !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
      >
        {sprite && (
          <>
            <SheetHeader>
              <SheetTitle>{sprite.name} Sprite</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col items-center gap-3 px-4">
              <div
                className={cn(
                  "flex aspect-square w-40 items-center justify-center rounded-xl bg-muted/50",
                  sprite.unreleased && "opacity-50 grayscale"
                )}
              >
                <img
                  src={getSpriteImage(sprite)}
                  alt={sprite.name}
                  className="size-4/5 object-contain"
                />
              </div>

              <ul className="flex flex-wrap items-center justify-center gap-1.5">
                <li
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    RARITY_COLORS[sprite.rarity]
                  )}
                >
                  {RARITY_LABELS[sprite.rarity]}
                </li>
                <li
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    VARIANT_COLORS[sprite.variant]
                  )}
                >
                  {VARIANT_LABELS[sprite.variant]}
                </li>
                {sprite.unreleased && (
                  <li className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Unreleased
                  </li>
                )}
              </ul>

              <p className="text-sm text-muted-foreground">
                Drop chance: {sprite.dropChance}
              </p>

              <Button
                className={cn(
                  "h-11 w-full text-base",
                  owned && "bg-emerald-500 text-white hover:bg-emerald-500/90"
                )}
                variant={owned ? undefined : "default"}
                onClick={() => onToggleOwned(sprite)}
              >
                {owned ? (
                  <>
                    <CheckIcon /> Owned
                  </>
                ) : (
                  "Mark as owned"
                )}
              </Button>
            </div>

            {siblings.length > 1 && (
              <div className="flex flex-col gap-2 px-4 pb-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Variants
                </p>
                <ul className="grid grid-cols-4 gap-2">
                  {siblings.map((sibling) => (
                    <SiblingThumb
                      key={sibling.id}
                      sibling={sibling}
                      active={sibling.id === sprite.id}
                      onSelect={() => onSelect(sibling)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SiblingThumb({
  sibling,
  active,
  onSelect,
}: {
  sibling: Sprite
  active: boolean
  onSelect: () => void
}) {
  const owned = useCollectionStore((s) => s.isOwned(sibling.id))

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
          active
            ? "border-primary/50 bg-muted/50"
            : "border-transparent hover:bg-muted/40"
        )}
      >
        <div
          className={cn(
            "relative flex aspect-square w-full items-center justify-center rounded-md bg-muted/50 ring-2 ring-transparent",
            owned && "ring-emerald-500",
            sibling.unreleased && "opacity-50 grayscale"
          )}
        >
          <img
            src={getSpriteImage(sibling)}
            alt={sibling.name}
            loading="lazy"
            className="size-4/5 object-contain"
          />
          {owned && (
            <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon className="size-2.5" strokeWidth={4} />
            </span>
          )}
        </div>
        <span className="text-[10px] leading-none text-muted-foreground">
          {VARIANT_LABELS[sibling.variant]}
        </span>
      </button>
    </li>
  )
}
