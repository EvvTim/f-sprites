type BadgeNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

// The Badging API is spec'd to only affect an installed app's home-screen/
// dock icon - on iOS (16.4+) it does nothing unless the page is running
// standalone (added to Home Screen), and on most browsers the method is
// undefined entirely for a plain browser tab. Warn once in dev instead of
// swallowing every call silently, so "badge doesn't show" is diagnosable.
let warned = false

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function updateAppBadge(count: number) {
  const nav = navigator as BadgeNavigator

  if (typeof nav.setAppBadge !== "function") {
    if (import.meta.env.DEV && !warned) {
      warned = true
      console.info(
        "[badge] navigator.setAppBadge is unavailable in this browser/context."
      )
    }
    return
  }

  if (import.meta.env.DEV && !warned && !isStandalone()) {
    warned = true
    console.info(
      "[badge] Not running in standalone (installed) mode - most browsers " +
        "only apply the app badge to a home-screen/dock icon, so it won't " +
        "show up while the app is open in a regular browser tab."
    )
  }

  nav.setAppBadge(count).catch((err: unknown) => {
    if (import.meta.env.DEV) console.info("[badge] setAppBadge failed:", err)
  })
}
