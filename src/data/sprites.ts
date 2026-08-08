import type { CSSProperties } from "react"

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

export function sortByVariant(a: Sprite, b: Sprite) {
  return VARIANT_ORDER.indexOf(a.variant) - VARIANT_ORDER.indexOf(b.variant)
}

// Matches the accent colors fortnite.gg itself uses per rarity/variant, so
// every tinted surface in the app (card glow, borders, badges) is exactly
// "in tone" with how the game presents it, not an approximated Tailwind hue.
export const SPRITE_TONE: Record<Rarity | Variant, { top: string; border: string }> = {
  rare: { top: "#104273", border: "#00afff" },
  epic: { top: "#4d1566", border: "#ce59ff" },
  legendary: { top: "#743e0a", border: "#de6e0e" },
  mythic: { top: "#a89442", border: "#f1e198" },
  special: { top: "#4d1566", border: "#ce59ff" },
  base: { top: "#104273", border: "#00afff" },
  gold: { top: "#9d752a", border: "#f5b642" },
  candy: { top: "#9f4540", border: "#f16f68" },
  galaxy: { top: "#463b9e", border: "#6d5df7" },
  gem: { top: "#7098a3", border: "#c9e7f2" },
  holofoil: { top: "#a1428e", border: "#f07ad8" },
  cube: { top: "#730974", border: "#8b008b" },
  quack: { top: "#6941a2", border: "#a66bff" },
}

export function getSpriteTone(sprite: Sprite) {
  return SPRITE_TONE[sprite.variant === "base" ? sprite.rarity : sprite.variant]
}

export function spriteBackgroundStyle(sprite: Sprite): CSSProperties {
  const { top, border } = getSpriteTone(sprite)
  return {
    backgroundImage: `radial-gradient(circle at 50% 30%, ${top}66 0%, ${top}26 55%, transparent 80%)`,
    boxShadow: `inset 0 -2px 0 0 ${border}55`,
  }
}

/** Card border: always tinted to the sprite's tone; owned cards get a
 * fully-saturated border + glow, unowned ones stay faded so "owned" reads
 * from the border strength rather than from a separate (tone-unrelated)
 * color, and the checkmark badge stays the sole "success" signal. */
export function spriteCardStyle(sprite: Sprite, owned: boolean): CSSProperties {
  const { border } = getSpriteTone(sprite)
  return {
    borderColor: owned ? border : `${border}30`,
    boxShadow: owned
      ? `0 0 0 1px ${border}55, 0 6px 16px -8px ${border}80`
      : undefined,
  }
}

// The game's accent colors are tuned for a dark UI; several (mythic, gem)
// are too pale to use directly against light backgrounds or under white
// text. Darken for those uses only, so the tinted surfaces stay legible in
// both themes without branching on color scheme.
function darken(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * factor)
  const g = Math.round(((n >> 8) & 255) * factor)
  const b = Math.round((n & 255) * factor)
  return `rgb(${r}, ${g}, ${b})`
}

/** Badge style for a rarity or variant pill, using the exact game accent
 * color as text over a matching low-alpha tint background. */
export function toneBadgeStyle(key: Rarity | Variant): CSSProperties {
  const { border } = SPRITE_TONE[key]
  return { backgroundColor: `${border}26`, color: darken(border, 0.7) }
}

/** A solid, always-dark-enough version of the tone accent - for filled
 * shapes (e.g. stepper dots) that need legible white text/icons on top. */
export function toneSolidColor(sprite: Sprite): string {
  return darken(getSpriteTone(sprite).border, 0.55)
}
