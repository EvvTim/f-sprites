import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { haptics } from "@/lib/haptics"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

// Elements a swipe-to-dismiss drag must not hijack — their own tap/drag
// behavior (chip selection, switches, buttons) takes priority. A drag is
// only armed when it starts outside of these.
const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, [role="switch"], [role="checkbox"], [contenteditable="true"]'

const SWIPE_CLOSE_DISTANCE_PX = 120
const SWIPE_CLOSE_HEIGHT_RATIO = 0.3
const SWIPE_SETTLE_MS = 200

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  const popupRef = React.useRef<HTMLDivElement | null>(null)
  const hiddenCloseRef = React.useRef<HTMLButtonElement | null>(null)
  const dragRef = React.useRef<{
    startY: number
    pointerId: number
    dragging: boolean
  } | null>(null)

  const swipeToDismiss = side === "bottom"

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeToDismiss) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return
    dragRef.current = { startY: e.clientY, pointerId: e.pointerId, dragging: false }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const popup = popupRef.current
    if (!drag || !popup) return
    const deltaY = e.clientY - drag.startY

    if (!drag.dragging) {
      if (deltaY <= 8 || popup.scrollTop > 0) return
      drag.dragging = true
      popup.setPointerCapture(e.pointerId)
      popup.style.transition = "none"
    }

    popup.style.transform = `translateY(${Math.max(0, deltaY)}px)`
    e.preventDefault()
  }

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const popup = popupRef.current
    dragRef.current = null
    if (!drag?.dragging || !popup) return

    popup.releasePointerCapture(drag.pointerId)
    popup.style.transition = `transform ${SWIPE_SETTLE_MS}ms ease-out`
    const deltaY = Math.max(0, e.clientY - drag.startY)
    const shouldClose =
      deltaY > SWIPE_CLOSE_DISTANCE_PX ||
      deltaY > popup.offsetHeight * SWIPE_CLOSE_HEIGHT_RATIO

    if (shouldClose) {
      haptics.tap()
      popup.style.transform = "translateY(100%)"
      window.setTimeout(() => hiddenCloseRef.current?.click(), SWIPE_SETTLE_MS)
    } else {
      popup.style.transform = ""
      window.setTimeout(() => {
        popup.style.transition = ""
      }, SWIPE_SETTLE_MS)
    }
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        ref={popupRef}
        data-slot="sheet-content"
        data-side={side}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        {swipeToDismiss && (
          <div
            aria-hidden
            className="sticky top-0 z-10 -mb-4 flex justify-center bg-inherit pt-2 pb-3"
          >
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/25" />
          </div>
        )}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3 after:absolute after:-inset-2"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
        {swipeToDismiss && (
          <SheetPrimitive.Close
            ref={hiddenCloseRef}
            tabIndex={-1}
            aria-hidden
            className="hidden"
          />
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
