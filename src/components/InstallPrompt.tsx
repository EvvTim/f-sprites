import { useEffect, useState } from "react"
import { DownloadIcon, ShareIcon, XIcon } from "lucide-react"

import peanutIcon from "@/assets/sprites/T_Icon_BR_Creature_Sprite_BurntPeanut_ui_L.webp"
import { Button } from "@/components/ui/button"
import { haptics } from "@/lib/haptics"

const DISMISS_KEY = "install-prompt-dismissed"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  )
}

function isIOS() {
  const ua = window.navigator.userAgent
  const isAppleDevice = /iPad|iPhone|iPod/.test(ua)
  const isIPadOS13Plus =
    /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  return isAppleDevice || isIPadOS13Plus
}

export function InstallPrompt() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  )
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSHint] = useState(() => !isStandalone() && isIOS())

  useEffect(() => {
    if (isStandalone()) return

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    )

    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
  }, [])

  const dismiss = () => {
    haptics.tap()
    localStorage.setItem(DISMISS_KEY, "1")
    setDismissed(true)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    haptics.tap()
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  if (dismissed || isStandalone() || (!deferredPrompt && !showIOSHint)) {
    return null
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 flex items-center gap-3 rounded-2xl border bg-popover p-3 text-popover-foreground shadow-lg">
      <img
        src={peanutIcon}
        alt=""
        className="size-11 shrink-0 rounded-xl bg-emerald-500/10 object-contain p-1"
      />

      <div className="min-w-0 flex-1 text-sm">
        {deferredPrompt ? (
          <>
            <p className="font-medium">Install Sprites</p>
            <p className="text-xs text-muted-foreground">
              Add it to your home screen for quick, app-like access.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">Install Sprites</p>
            <p className="text-xs text-muted-foreground">
              Tap <ShareIcon className="mx-0.5 inline size-3.5 align-text-top" />
              {" "}Share, then "Add to Home Screen".
            </p>
          </>
        )}
      </div>

      {deferredPrompt && (
        <Button
          size="sm"
          className="shrink-0 gap-1"
          onClick={handleInstall}
        >
          <DownloadIcon /> Install
        </Button>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-90 hover:text-foreground"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  )
}
