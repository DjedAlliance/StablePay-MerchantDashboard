"use client"

import { useState, useEffect } from "react"

export interface ThemePermissions {
  allowLightMode: boolean
  allowDarkMode: boolean
  allowSystemMode: boolean
  defaultTheme: "light" | "dark" | "system"
  lockTheme: boolean // If true, user cannot change theme
}

const DEFAULT_PERMISSIONS: ThemePermissions = {
  allowLightMode: true,
  allowDarkMode: true,
  allowSystemMode: true,
  defaultTheme: "dark",
  lockTheme: false,
}

export function useThemePermissions() {
  const [permissions, setPermissions] = useState<ThemePermissions>(DEFAULT_PERMISSIONS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load permissions from localStorage
    const savedPermissions = localStorage.getItem("theme-permissions")
    if (savedPermissions) {
      try {
        const parsed = JSON.parse(savedPermissions)
        setPermissions({ ...DEFAULT_PERMISSIONS, ...parsed })
      } catch (error) {
        console.error("Failed to parse theme permissions:", error)
      }
    }
  }, [])

  const updatePermissions = (newPermissions: Partial<ThemePermissions>) => {
    const updated = { ...permissions, ...newPermissions }
    setPermissions(updated)
    if (mounted) {
      localStorage.setItem("theme-permissions", JSON.stringify(updated))
    }
  }

  const resetPermissions = () => {
    setPermissions(DEFAULT_PERMISSIONS)
    if (mounted) {
      localStorage.removeItem("theme-permissions")
    }
  }

  const getAvailableThemes = () => {
    const themes: Array<{ value: string; label: string; icon: string }> = []
    
    if (permissions.allowLightMode) {
      themes.push({ value: "light", label: "Light", icon: "sun" })
    }
    
    if (permissions.allowDarkMode) {
      themes.push({ value: "dark", label: "Dark", icon: "moon" })
    }
    
    if (permissions.allowSystemMode) {
      themes.push({ value: "system", label: "System", icon: "monitor" })
    }

    return themes
  }

  return {
    permissions,
    updatePermissions,
    resetPermissions,
    getAvailableThemes,
    mounted,
  }
}