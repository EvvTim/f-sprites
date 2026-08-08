import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  RARITY_LABELS,
  VARIANT_LABELS,
  getSpriteImage,
  sortByVariant,
  spriteBackgroundStyle,
  sprites,
  toneBadgeStyle,
} from "@/data/sprites"
import type { Sprite } from "@/data/types"
import { haptics } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import { useCollectionStore } from "@/store/useCollectionStore"

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
                style={spriteBackgroundStyle(sprite)}
              >
                <img
                  src={getSpriteImage(sprite)}
                  alt={sprite.name}
                  className="size-4/5 object-contain"
                />
              </div>

              <ul className="flex flex-wrap items-center justify-center gap-1.5">
                <li
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={toneBadgeStyle(sprite.rarity)}
                >
                  {RARITY_LABELS[sprite.rarity]}
                </li>
                <li
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    sprite.variant === "base" &&
                      "bg-muted text-muted-foreground"
                  )}
                  style={
                    sprite.variant === "base"
                      ? undefined
                      : toneBadgeStyle(sprite.variant)
                  }
                >
                  {VARIANT_LABELS[sprite.variant]}
                </li>
                {sprite.unreleased && (
                  <li className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Unreleased
                  </li>
                )}
              </ul>

              {sprite.squadBonus && (
                <p
                  className="w-full rounded-lg px-3 py-2 text-center text-xs font-medium"
                  style={toneBadgeStyle(sprite.rarity)}
                >
                  {sprite.squadBonus}
                </p>
              )}

              {!sprite.dropChances?.length && (
                <p className="text-sm text-muted-foreground">
                  Drop chance: {sprite.dropChance}
                </p>
              )}

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

              {!!sprite.effect?.length && (
                <div className="w-full space-y-1.5 text-sm text-muted-foreground">
                  {sprite.effect.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}

              {!!sprite.facts?.length && (
                <ul className="w-full divide-y divide-border rounded-lg border text-sm">
                  {sprite.facts.map((fact) => (
                    <li
                      key={fact.label}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span className="text-muted-foreground">
                        {fact.label}
                      </span>
                      <span className="font-medium">{fact.value}</span>
                    </li>
                  ))}
                </ul>
              )}

              {!!sprite.dropChances?.length && (
                <div className="w-full">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Drop Chances
                  </p>
                  <ul className="divide-y divide-border rounded-lg border text-sm">
                    {sprite.dropChances.map((d) => (
                      <li
                        key={d.label}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <span className="text-muted-foreground">
                          {d.label}
                        </span>
                        <span className="font-medium">{d.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
        onClick={() => {
          haptics.tap()
          onSelect()
        }}
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
          style={spriteBackgroundStyle(sibling)}
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
