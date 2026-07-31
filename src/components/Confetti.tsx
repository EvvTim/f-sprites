import { useEffect } from "react"

import type { ConfettiParticle } from "@/lib/confetti"

const LIFETIME_MS = 2200

type ConfettiProps = {
  particles: ConfettiParticle[]
  onDone: () => void
}

export function Confetti({ particles, onDone }: ConfettiProps) {
  useEffect(() => {
    const timeout = setTimeout(onDone, LIFETIME_MS)
    return () => clearTimeout(timeout)
  }, [onDone])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={
            {
              left: `${p.left}%`,
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              animation: `confetti-fall ${p.duration}ms cubic-bezier(0.35, 0, 0.65, 1) ${p.delay}ms forwards`,
              "--confetti-drift": `${p.drift}px`,
              "--confetti-rotation": `${p.rotation}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
