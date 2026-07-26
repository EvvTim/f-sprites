export type Rarity = "rare" | "epic" | "legendary" | "mythic" | "special"

export type Variant =
  "base" | "gold" | "candy" | "galaxy" | "gem" | "holofoil" | "cube" | "quack"

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
}
