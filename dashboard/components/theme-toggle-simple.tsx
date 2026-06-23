"use client"

import * as React from "react"
import { Moon, Sun, Lock } from "lucide-react"
import { useTheme } from "next-themes"
import { useThemePermissions } from "@/hooks/use-theme-permissions"

import { Button } from "@/components/ui/button"

export function ThemeToggleSimple() {
  const { theme, setTheme } = useTheme()
  const { permissions, getAvailableThemes, mounted } = useThemePermissions()
  const [componentMounted, setComponentMounted] = React.useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setComponentMounted(true)
  }, [])

  if (!mounted || !componentMounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const availableThemes = getAvailableThemes()

  // If theme is locked, show lock icon
  if (permissions.lockTheme) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0" disabled>
        <Lock className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Theme locked</span>
      </Button>
    )
  }

  // If only one theme available, show it but disabled
  if (availableThemes.length <= 1) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0" disabled>
        {theme === "light" ? (
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        )}
        <span className="sr-only">Single theme mode</span>
      </Button>
    )
  }

  // For multiple themes, cycle through available ones
  const handleToggle = () => {
    const currentIndex = availableThemes.findIndex(t => t.value === theme)
    const nextIndex = (currentIndex + 1) % availableThemes.length
    setTheme(availableThemes[nextIndex].value)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 px-0"
      onClick={handleToggle}
    >
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}