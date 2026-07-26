import { useEffect, useRef, useState, type ReactNode } from "react"
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  RARITY_LABELS,
  RARITY_ORDER,
  VARIANT_LABELS,
  VARIANT_ORDER,
} from "@/data/sprites"
import type { Rarity, Variant } from "@/data/types"
import { cn } from "@/lib/utils"

type FiltersProps = {
  query: string
  onQueryChange: (value: string) => void
  rarity: Rarity | "all"
  onRarityChange: (value: Rarity | "all") => void
  variant: Variant | "all"
  onVariantChange: (value: Variant | "all") => void
  onlyOwned: boolean
  onOnlyOwnedChange: (value: boolean) => void
  onlyMissing: boolean
  onOnlyMissingChange: (value: boolean) => void
  showUnreleased: boolean
  onShowUnreleasedChange: (value: boolean) => void
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

export function Filters({
  query,
  onQueryChange,
  rarity,
  onRarityChange,
  variant,
  onVariantChange,
  onlyOwned,
  onOnlyOwnedChange,
  onlyMissing,
  onOnlyMissingChange,
  showUnreleased,
  onShowUnreleasedChange,
}: FiltersProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const activeCount =
    (rarity !== "all" ? 1 : 0) +
    (variant !== "all" ? 1 : 0) +
    (onlyOwned ? 1 : 0) +
    (onlyMissing ? 1 : 0) +
    (showUnreleased ? 1 : 0)

  const resetAll = () => {
    onRarityChange("all")
    onVariantChange("all")
    onOnlyOwnedChange(false)
    onOnlyMissingChange(false)
    onShowUnreleasedChange(false)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search sprites…"
          className="h-10 rounded-full pl-9 text-sm"
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant={activeCount > 0 ? "default" : "outline"}
          size="icon-lg"
          className="relative shrink-0 rounded-full"
          onClick={() => setOpen(true)}
          aria-label="Filters"
        >
          <SlidersHorizontalIcon className="size-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>

        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-2">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Rarity
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={rarity === "all"}
                  onClick={() => onRarityChange("all")}
                >
                  All
                </Chip>
                {RARITY_ORDER.map((r) => (
                  <Chip
                    key={r}
                    active={rarity === r}
                    onClick={() => onRarityChange(rarity === r ? "all" : r)}
                  >
                    {RARITY_LABELS[r]}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Variant
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Chip
                  active={variant === "all"}
                  onClick={() => onVariantChange("all")}
                >
                  All
                </Chip>
                {VARIANT_ORDER.map((v) => (
                  <Chip
                    key={v}
                    active={variant === v}
                    onClick={() => onVariantChange(variant === v ? "all" : v)}
                  >
                    {VARIANT_LABELS[v]}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-3">
              <label className="flex items-center justify-between text-sm">
                Only owned
                <Switch
                  checked={onlyOwned}
                  onCheckedChange={(checked) => {
                    onOnlyOwnedChange(checked)
                    if (checked) onOnlyMissingChange(false)
                  }}
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                Only missing
                <Switch
                  checked={onlyMissing}
                  onCheckedChange={(checked) => {
                    onOnlyMissingChange(checked)
                    if (checked) onOnlyOwnedChange(false)
                  }}
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                Show unreleased
                <Switch
                  checked={showUnreleased}
                  onCheckedChange={onShowUnreleasedChange}
                />
              </label>
            </div>
          </div>

          <SheetFooter className="flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={resetAll}
              disabled={activeCount === 0}
            >
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
