// Safari/WebKit (iOS and iPadOS, in or out of a home-screen PWA) has never
// implemented the Vibration API - `navigator.vibrate` simply doesn't exist
// there, so calls silently no-op with no error. That's a platform
// limitation with no JS workaround, not a bug - log it once so it's
// diagnosable instead of a silent mystery.
let warned = false

function fire(pattern: number | number[]) {
  if (typeof navigator.vibrate !== "function") {
    if (import.meta.env.DEV && !warned) {
      warned = true
      console.info(
        "[haptics] navigator.vibrate is unavailable in this browser " +
          "(expected on iOS/Safari - WebKit doesn't implement the Vibration API). " +
          "Haptic calls will silently no-op."
      )
    }
    return
  }
  navigator.vibrate(pattern)
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
