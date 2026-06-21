"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggleSimpleClick() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    console.log('Current theme:', theme)
    if (theme === "light") {
      setTheme("dark")
      console.log('Switching to dark')
    } else if (theme === "dark") {
      setTheme("system")
      console.log('Switching to system')
    } else {
      setTheme("light")
      console.log('Switching to light')
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 px-0 relative z-50 hover:bg-accent dark:hover:shadow-button"
      onClick={cycleTheme}
      title={`Current: ${theme} - Click to cycle`}
    >
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : theme === "dark" ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Monitor className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}