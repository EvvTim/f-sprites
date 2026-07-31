import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { allSpriteImageUrls } from "@/data/sprites.ts"

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        const shellUrls = Array.from(
          document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
            "script[src], link[rel='stylesheet'], link[rel='icon'], link[rel='apple-touch-icon'], link[rel='manifest']"
          )
        ).map((el) => ("src" in el ? el.src : el.href))

        registration.active?.postMessage({
          type: "PRECACHE_URLS",
          urls: [...shellUrls, ...allSpriteImageUrls],
        })
      })
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
