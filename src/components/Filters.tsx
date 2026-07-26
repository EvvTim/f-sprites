import { useEffect, useRef, useState, type ReactNode } from "react"
import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react"

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
        "flex min-h-9 shrink-0 items-center rounded-full border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors active:scale-95",
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
    const handleUserScroll = () => {
      if (document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    }
    window.addEventListener("touchmove", handleUserScroll, { passive: true })
    window.addEventListener("wheel", handleUserScroll, { passive: true })
    return () => {
      window.removeEventListener("touchmove", handleUserScroll)
      window.removeEventListener("wheel", handleUserScroll)
    }
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
    <search className="flex items-center gap-2">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search sprites…"
          className="h-10 rounded-full pl-9 pr-9 text-base md:text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center text-muted-foreground active:scale-90 hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant={activeCount > 0 ? "default" : "outline"}
          size="icon-lg"
          className="relative size-11 shrink-0 rounded-full"
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
            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-medium text-muted-foreground">
                Rarity
              </legend>
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Chip
                    active={rarity === "all"}
                    onClick={() => onRarityChange("all")}
                  >
                    All
                  </Chip>
                </li>
                {RARITY_ORDER.map((r) => (
                  <li key={r}>
                    <Chip
                      active={rarity === r}
                      onClick={() => onRarityChange(rarity === r ? "all" : r)}
                    >
                      {RARITY_LABELS[r]}
                    </Chip>
                  </li>
                ))}
              </ul>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-xs font-medium text-muted-foreground">
                Variant
              </legend>
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Chip
                    active={variant === "all"}
                    onClick={() => onVariantChange("all")}
                  >
                    All
                  </Chip>
                </li>
                {VARIANT_ORDER.map((v) => (
                  <li key={v}>
                    <Chip
                      active={variant === v}
                      onClick={() =>
                        onVariantChange(variant === v ? "all" : v)
                      }
                    >
                      {VARIANT_LABELS[v]}
                    </Chip>
                  </li>
                ))}
              </ul>
            </fieldset>

            <ul className="flex flex-col divide-y divide-border border-t border-border">
              <li>
                <label
                  htmlFor="filter-only-owned"
                  className="flex min-h-11 cursor-pointer items-center justify-between py-2 text-sm active:bg-muted/50"
                >
                  Only owned
                  <Switch
                    id="filter-only-owned"
                    checked={onlyOwned}
                    onCheckedChange={(checked) => {
                      onOnlyOwnedChange(checked)
                      if (checked) onOnlyMissingChange(false)
                    }}
                  />
                </label>
              </li>
              <li>
                <label
                  htmlFor="filter-only-missing"
                  className="flex min-h-11 cursor-pointer items-center justify-between py-2 text-sm active:bg-muted/50"
                >
                  Only missing
                  <Switch
                    id="filter-only-missing"
                    checked={onlyMissing}
                    onCheckedChange={(checked) => {
                      onOnlyMissingChange(checked)
                      if (checked) onOnlyOwnedChange(false)
                    }}
                  />
                </label>
              </li>
              <li>
                <label
                  htmlFor="filter-show-unreleased"
                  className="flex min-h-11 cursor-pointer items-center justify-between py-2 text-sm active:bg-muted/50"
                >
                  Show unreleased
                  <Switch
                    id="filter-show-unreleased"
                    checked={showUnreleased}
                    onCheckedChange={onShowUnreleasedChange}
                  />
                </label>
              </li>
            </ul>
          </div>

          <SheetFooter className="flex-row gap-3">
            <Button
              variant="outline"
              className="h-11 flex-1 text-base"
              onClick={resetAll}
              disabled={activeCount === 0}
            >
              Reset
            </Button>
            <Button
              className="h-11 flex-1 text-base"
              onClick={() => setOpen(false)}
            >
              Show results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </search>
  )
}
