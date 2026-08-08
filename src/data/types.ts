export type Rarity = "rare" | "epic" | "legendary" | "mythic" | "special"

export type Variant =
  "base" | "gold" | "candy" | "galaxy" | "gem" | "holofoil" | "cube" | "quack"

export type SpriteFact = {
  label: string
  value: string
}

export type Sprite = {
  id: number
  slug: string
  name: string
  parent: string
  rarity: Rarity
  variant: Variant
  image: string
  dropChance: string
  unreleased: boolean
  /** Squad-wide buff text shown only for "special" rarity sprites. */
  squadBonus?: string | null
  /** Ability description paragraphs, e.g. effect + per-level scaling. */
  effect?: string[]
  /** Location/Summon Cost etc., in the order fortnite.gg lists them. */
  facts?: SpriteFact[]
  /** Per-source drop chance breakdown, e.g. "Sprite Chest" -> "0.53%". */
  dropChances?: SpriteFact[]
}
