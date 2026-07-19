"use client"

import * as React from "react"

export type FontScaleValue = "sm" | "base" | "lg" | "xl"

export const FONT_SCALES: Record<FontScaleValue, number> = {
  sm: 0.9,
  base: 1,
  lg: 1.1,
  xl: 1.2,
}

export const FONT_SCALE_OPTIONS: { value: FontScaleValue; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "base", label: "Default" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
]

const STORAGE_KEY = "stablepay_font_scale"
const DEFAULT_SCALE: FontScaleValue = "base"

/** Applies the numeric multiplier to the document root as a CSS variable. */
function applyScale(value: FontScaleValue) {
  if (typeof document === "undefined") return
  document.documentElement.style.setProperty("--font-scale", String(FONT_SCALES[value]))
}

type FontScaleContextValue = {
  fontScale: FontScaleValue
  setFontScale: (value: FontScaleValue) => void
  mounted: boolean
}

const FontScaleContext = React.createContext<FontScaleContextValue | null>(null)

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = React.useState<FontScaleValue>(DEFAULT_SCALE)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as FontScaleValue | null
      if (saved && saved in FONT_SCALES) {
        setFontScaleState(saved)
        applyScale(saved)
      }
    } catch {
      // ignore storage access errors
    }
  }, [])

  const setFontScale = React.useCallback((value: FontScaleValue) => {
    setFontScaleState(value)
    applyScale(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore storage access errors
    }
  }, [])

  const contextValue = React.useMemo(
    () => ({ fontScale, setFontScale, mounted }),
    [fontScale, setFontScale, mounted],
  )

  return <FontScaleContext.Provider value={contextValue}>{children}</FontScaleContext.Provider>
}

export function useFontScale() {
  const ctx = React.useContext(FontScaleContext)
  if (!ctx) {
    throw new Error("useFontScale must be used within a FontScaleProvider")
  }
  return ctx
}

/**
 * Inline script that runs before paint to set --font-scale from localStorage,
 * preventing a flash of the default text size on first load.
 *
 * The scale map is serialized from FONT_SCALES so it can never drift from the
 * values used at runtime.
 */
export const FONT_SCALE_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});var m=${JSON.stringify(
  FONT_SCALES,
)};if(s&&Object.prototype.hasOwnProperty.call(m,s)){document.documentElement.style.setProperty("--font-scale",String(m[s]));}}catch(e){}})();`
