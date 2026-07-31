export function vibrate(pattern: number | number[] = 15) {
  navigator.vibrate?.(pattern)
}
