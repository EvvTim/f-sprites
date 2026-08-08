import { useEffect, useMemo, useState } from "react"
import { BarChart3Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CollectionProgress } from "@/components/CollectionProgress"
// import { Confetti } from "@/components/Confetti"
import { Filters } from "@/components/Filters"
import { InstallPrompt } from "@/components/InstallPrompt"
import { SpriteCard } from "@/components/SpriteCard"
import { SpriteDetailDialog } from "@/components/SpriteDetailDialog"
import { Button } from "@/components/ui/button"
import { sprites } from "@/data/sprites"
import type { Rarity, Sprite, Variant } from "@/data/types"
import { updateAppBadge } from "@/lib/badge"
import { createConfettiBurst, type ConfettiParticle } from "@/lib/confetti"
import { haptics } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import { useCollectionStore } from "@/store/useCollectionStore"

export function App() {
  const [query, setQuery] = useState("")
  const [rarity, setRarity] = useState<Rarity | "all">("all")
  const [variant, setVariant] = useState<Variant | "all">("all")
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [showUnreleased, setShowUnreleased] = useState(false)
  const [activeSprite, setActiveSprite] = useState<Sprite | null>(null)
  const [pendingRemove, setPendingRemove] = useState<Sprite | null>(null)
  const [progressOpen, setProgressOpen] = useState(false)
  const [celebration, setCelebration] = useState<{
    key: number
    particles: ConfettiParticle[]
  } | null>(null)

  console.log(celebration)

  const owned = useCollectionStore((s) => s.owned)
  const toggleOwned = useCollectionStore((s) => s.toggleOwned)

  const handleToggleOwned = (sprite: Sprite) => {
    if (owned[sprite.id]) {
      haptics.tap()
      setPendingRemove(sprite)
    } else {
      const releasedSiblings = sprites.filter(
        (s) => s.parent === sprite.parent && !s.unreleased
      )
      const wasSetComplete =
        releasedSiblings.length > 0 &&
        releasedSiblings.every((s) => owned[s.id])
      const isSetComplete =
        releasedSiblings.length > 0 &&
        releasedSiblings.every((s) => s.id === sprite.id || owned[s.id])

      if (!wasSetComplete && isSetComplete) {
        haptics.celebrate()
        setCelebration({ key: Date.now(), particles: createConfettiBurst() })
      } else {
        haptics.toggleOn()
      }

      toggleOwned(sprite.id)
      setActiveSprite(null)
    }
  }

  const releasedTotal = useMemo(
    () => sprites.filter((s) => !s.unreleased).length,
    []
  )
  const ownedCount = useMemo(
    () => sprites.filter((s) => !s.unreleased && owned[s.id]).length,
    [owned]
  )

  useEffect(() => {
    updateAppBadge(releasedTotal - ownedCount)
  }, [releasedTotal, ownedCount])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sprites.filter((s) => {
      if (!showUnreleased && s.unreleased) return false
      if (rarity !== "all" && s.rarity !== rarity) return false
      if (variant !== "all" && s.variant !== variant) return false
      if (onlyOwned && !owned[s.id]) return false
      if (onlyMissing && owned[s.id]) return false
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.parent.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [query, rarity, variant, onlyOwned, onlyMissing, showUnreleased, owned])

  return (
    <div className="mx-auto min-h-svh max-w-5xl pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="sticky top-0 z-10 bg-background/95 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur-sm">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h1 className="font-heading text-lg font-semibold">Sprites</h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              haptics.tap()
              setProgressOpen(true)
            }}
          >
            <BarChart3Icon />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {ownedCount}
            </span>
            <span className="text-muted-foreground">
              / {releasedTotal} owned
            </span>
          </Button>
        </header>

        <div
          role="progressbar"
          aria-valuenow={ownedCount}
          aria-valuemin={0}
          aria-valuemax={releasedTotal}
          aria-label="Overall collection progress"
          className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              ownedCount === releasedTotal ? "bg-emerald-500" : "bg-primary"
            )}
            style={{
              width: `${releasedTotal === 0 ? 0 : (ownedCount / releasedTotal) * 100}%`,
            }}
          />
        </div>

        <Filters
          query={query}
          onQueryChange={setQuery}
          rarity={rarity}
          onRarityChange={setRarity}
          variant={variant}
          onVariantChange={setVariant}
          onlyOwned={onlyOwned}
          onOnlyOwnedChange={setOnlyOwned}
          onlyMissing={onlyMissing}
          onOnlyMissingChange={setOnlyMissing}
          showUnreleased={showUnreleased}
          onShowUnreleasedChange={setShowUnreleased}
        />
      </div>

      <main>
        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No sprites match your filters.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 px-4 pt-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((sprite) => (
              <SpriteCard
                key={sprite.id}
                sprite={sprite}
                owned={Boolean(owned[sprite.id])}
                onOpen={() => setActiveSprite(sprite)}
                onToggleOwned={() => handleToggleOwned(sprite)}
              />
            ))}
          </ul>
        )}
      </main>

      <SpriteDetailDialog
        sprite={activeSprite}
        onOpenChange={(open) => {
          if (!open) setActiveSprite(null)
        }}
        onSelect={setActiveSprite}
        onToggleOwned={handleToggleOwned}
      />

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be marked as not owned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              className="h-11 text-base"
              onClick={() => haptics.tap()}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 text-base"
              onClick={() => {
                if (pendingRemove) {
                  haptics.toggleOff()
                  toggleOwned(pendingRemove.id)
                }
                setPendingRemove(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CollectionProgress open={progressOpen} onOpenChange={setProgressOpen} />

      {/*{celebration !== null && (*/}
      {/*  <Confetti*/}
      {/*    key={celebration.key}*/}
      {/*    particles={celebration.particles}*/}
      {/*    onDone={() => setCelebration(null)}*/}
      {/*  />*/}
      {/*)}*/}

      <InstallPrompt />
    </div>
  )
}

export default App
