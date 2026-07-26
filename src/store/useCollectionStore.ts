import { create } from "zustand"
import { persist } from "zustand/middleware"

type CollectionState = {
  owned: Record<number, true>
  isOwned: (id: number) => boolean
  toggleOwned: (id: number) => void
  ownedCount: () => number
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      owned: {},
      isOwned: (id) => Boolean(get().owned[id]),
      toggleOwned: (id) =>
        set((state) => {
          const owned = { ...state.owned }
          if (owned[id]) {
            delete owned[id]
          } else {
            owned[id] = true
          }
          return { owned }
        }),
      ownedCount: () => Object.keys(get().owned).length,
    }),
    { name: "sprites-collection" }
  )
)
