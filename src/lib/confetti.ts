const COLORS = [
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#06b6d4",
  "#f43f5e",
]
const PARTICLE_COUNT = 40

export type ConfettiParticle = {
  id: number
  left: number
  color: string
  width: number
  height: number
  delay: number
  duration: number
  rotation: number
  drift: number
}

export function createConfettiBurst(): ConfettiParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    left: Math.random() * 100,
    color: COLORS[id % COLORS.length],
    width: 6 + Math.random() * 5,
    height: 8 + Math.random() * 8,
    delay: Math.random() * 250,
    duration: 1300 + Math.random() * 700,
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 140,
  }))
}
