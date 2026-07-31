import raw from "./sprites.json"
import type { Rarity, Sprite, Variant } from "./types"

export const sprites = raw as Sprite[]

const imageModules = import.meta.glob("../assets/sprites/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>

const imagesByFilename: Record<string, string> = {}
for (const [path, url] of Object.entries(imageModules)) {
  imagesByFilename[path.split("/").pop()!] = url
}

export function getSpriteImage(sprite: Sprite): string {
  const filename = sprite.image.split("/").pop()!
  return imagesByFilename[filename] ?? sprite.image
}

export const allSpriteImageUrls = Object.values(imagesByFilename)

export const VARIANT_ORDER: Variant[] = [
  "base",
  "gold",
  "candy",
  "galaxy",
  "gem",
  "holofoil",
  "cube",
  "quack",
]

export const VARIANT_LABELS: Record<Variant, string> = {
  base: "Base",
  gold: "Gold",
  candy: "Gummy",
  galaxy: "Galaxy",
  gem: "Gem",
  holofoil: "Holofoil",
  cube: "Cube",
  quack: "Quack",
}

export const RARITY_ORDER: Rarity[] = [
  "rare",
  "epic",
  "legendary",
  "mythic",
  "special",
]

export const RARITY_LABELS: Record<Rarity, string> = {
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
  special: "Special",
}

export const RARITY_COLORS: Record<Rarity, string> = {
  rare: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  epic: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  legendary: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  mythic: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  special: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
}

export const VARIANT_COLORS: Record<Variant, string> = {
  base: "bg-muted text-muted-foreground",
  gold: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  candy: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  galaxy: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  gem: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  holofoil: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  cube: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  quack: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
}

export function sortByVariant(a: Sprite, b: Sprite) {
  return VARIANT_ORDER.indexOf(a.variant) - VARIANT_ORDER.indexOf(b.variant)
}
