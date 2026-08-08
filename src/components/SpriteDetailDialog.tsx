import type { ComponentType, ReactNode } from "react"
import {
  CheckIcon,
  CoinsIcon,
  DicesIcon,
  InfoIcon,
  MapPinIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"

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
  toneSolidColor,
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

const FACT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Location: MapPinIcon,
  "Summon Cost": CoinsIcon,
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </p>
  )
}

// Matches lines like "Required damage decreases at each Level Up: 150
// Damage -> 125 Damage -> 100 Damage -> 75 Damage -> 50 Damage to trigger" -
// scraped verbatim from fortnite.gg's own per-level scaling copy.
function parseLevelUpSteps(line: string): { intro: string; steps: string[] } | null {
  const match = line.match(/^(.*Level Up)\s*:\s*(.+)$/i)
  if (!match) return null
  const steps = match[2]
    .split(/\s*->\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (steps.length < 2) return null
  return { intro: match[1].trim(), steps }
}

function LevelSteps({
  intro,
  steps,
  color,
}: {
  intro: string
  steps: string[]
  color: string
}) {
  return (
    <div className="w-full">
      <p className="mb-2 text-xs text-muted-foreground">{intro}</p>
      <ol className="w-full">
        {steps.map((step, i) => (
          <li key={i} className="relative flex gap-2.5 pb-2.5 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute top-[18px] left-[8.5px] w-px"
                style={{
                  height: "calc(100% - 1rem)",
                  backgroundColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                }}
              />
            )}
            <span
              className="relative z-10 mt-px flex size-[17px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {i + 1}
            </span>
            <span className="text-xs leading-[17px] font-medium">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function FactList({
  facts,
  icons = true,
}: {
  facts: { label: string; value: string }[]
  icons?: boolean
}) {
  return (
    <ul className="w-full divide-y divide-border rounded-lg border text-sm">
      {facts.map((fact) => {
        const Icon = FACT_ICONS[fact.label] ?? InfoIcon
        return (
          <li
            key={fact.label}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              {icons && <Icon className="size-4 shrink-0" />}
              {fact.label}
            </span>
            <span className="font-medium">{fact.value}</span>
          </li>
        )
      })}
    </ul>
  )
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
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium"
                  style={toneBadgeStyle(sprite.rarity)}
                >
                  <UsersIcon className="size-4 shrink-0" />
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

              {(!!sprite.effect?.length ||
                !!sprite.facts?.length ||
                !!sprite.dropChances?.length) && (
                <div className="w-full border-t border-border" />
              )}

              {!!sprite.effect?.length && (
                <div className="w-full space-y-2">
                  <SectionLabel icon={ZapIcon}>Ability</SectionLabel>
                  <p className="text-sm font-medium">{sprite.effect[0]}</p>
                  {sprite.effect.slice(1).map((line, i) => {
                    const levelUp = parseLevelUpSteps(line)
                    return levelUp ? (
                      <LevelSteps
                        key={i}
                        intro={levelUp.intro}
                        steps={levelUp.steps}
                        color={toneSolidColor(sprite)}
                      />
                    ) : (
                      <p key={i} className="text-xs text-muted-foreground">
                        {line}
                      </p>
                    )
                  })}
                </div>
              )}

              {!!sprite.facts?.length && (
                <div className="w-full space-y-1.5">
                  <SectionLabel icon={InfoIcon}>Details</SectionLabel>
                  <FactList facts={sprite.facts} />
                </div>
              )}

              {!!sprite.dropChances?.length && (
                <div className="w-full space-y-1.5">
                  <SectionLabel icon={DicesIcon}>Drop Chances</SectionLabel>
                  <FactList facts={sprite.dropChances} icons={false} />
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
