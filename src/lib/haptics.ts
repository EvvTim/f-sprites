function fire(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}

export const haptics = {
  /** Light tap for taps, opening/closing sheets, chips, switches. */
  tap: () => fire(8),
  /** Marking a sprite as owned. */
  toggleOn: () => fire(15),
  /** Removing a sprite from the collection. */
  toggleOff: () => fire([10, 30, 12]),
  /** A whole set (parent) was just completed. */
  celebrate: () => fire([20, 60, 20, 60, 20, 90, 40]),
}
