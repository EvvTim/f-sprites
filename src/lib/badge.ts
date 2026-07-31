type BadgeNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

export function updateAppBadge(count: number) {
  const nav = navigator as BadgeNavigator
  nav.setAppBadge?.(count).catch(() => {})
}
