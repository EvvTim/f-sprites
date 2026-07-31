import { useMemo } from "react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getSpriteImage, sprites } from "@/data/sprites"
import { useCollectionStore } from "@/store/useCollectionStore"
import { cn } from "@/lib/utils"

type CollectionProgressProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ParentProgress = {
  parent: string
  owned: number
  total: number
  image: string
}

export function CollectionProgress({
  open,
  onOpenChange,
}: CollectionProgressProps) {
  const owned = useCollectionStore((s) => s.owned)

  const groups = useMemo<ParentProgress[]>(() => {
    const byParent = new Map<
      string,
      { owned: number; total: number; image: string }
    >()
    for (const sprite of sprites) {
      if (sprite.unreleased) continue
      const entry = byParent.get(sprite.parent) ?? {
        owned: 0,
        total: 0,
        image: getSpriteImage(sprite),
      }
      entry.total += 1
      if (owned[sprite.id]) entry.owned += 1
      if (sprite.variant === "base") entry.image = getSpriteImage(sprite)
      byParent.set(sprite.parent, entry)
    }
    return Array.from(byParent, ([parent, v]) => ({ parent, ...v })).sort(
      (a, b) =>
        a.owned / a.total - b.owned / b.total || a.parent.localeCompare(b.parent)
    )
  }, [owned])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle>Progress by set</SheetTitle>
        </SheetHeader>

        <ul className="flex flex-col gap-3 px-4 pb-4">
          {groups.map((group) => {
            const pct = (group.owned / group.total) * 100
            const complete = group.owned === group.total

            return (
              <li key={group.parent} className="flex items-center gap-3">
                <img
                  src={group.image}
                  alt=""
                  className="size-9 shrink-0 rounded-lg bg-muted/50 object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {group.parent}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium tabular-nums",
                        complete
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {group.owned}/{group.total}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={group.owned}
                    aria-valuemin={0}
                    aria-valuemax={group.total}
                    aria-label={`${group.parent} progress`}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width]",
                        complete ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
