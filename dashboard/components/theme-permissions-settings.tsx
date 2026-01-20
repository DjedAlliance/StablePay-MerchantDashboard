"use client"

import * as React from "react"
import { Settings, Lock, Unlock } from "lucide-react"
import { useThemePermissions } from "@/hooks/use-theme-permissions"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function ThemePermissionsSettings() {
  const { permissions, updatePermissions, resetPermissions, mounted } = useThemePermissions()
  const { setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  if (!mounted) return null

  const handlePermissionChange = (key: keyof typeof permissions, value: boolean | string) => {
    const newPermissions = { ...permissions, [key]: value }
    
    // If we're disabling the current theme, switch to an allowed one
    if (key === "allowLightMode" && !value && permissions.defaultTheme === "light") {
      newPermissions.defaultTheme = permissions.allowDarkMode ? "dark" : "system"
    }
    if (key === "allowDarkMode" && !value && permissions.defaultTheme === "dark") {
      newPermissions.defaultTheme = permissions.allowLightMode ? "light" : "system"
    }
    if (key === "allowSystemMode" && !value && permissions.defaultTheme === "system") {
      newPermissions.defaultTheme = permissions.allowLightMode ? "light" : "dark"
    }

    updatePermissions(newPermissions)
    
    // Apply the default theme if it changed
    if (newPermissions.defaultTheme !== permissions.defaultTheme) {
      setTheme(newPermissions.defaultTheme)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Theme Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Theme Permissions
          </DialogTitle>
          <DialogDescription>
            Configure which theme options are available and set default preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Theme Lock */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                {permissions.lockTheme ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                Lock Theme
              </Label>
              <p className="text-sm text-muted-foreground">
                Prevent users from changing the theme
              </p>
            </div>
            <Button
              variant={permissions.lockTheme ? "default" : "outline"}
              size="sm"
              onClick={() => handlePermissionChange("lockTheme", !permissions.lockTheme)}
            >
              {permissions.lockTheme ? "Locked" : "Unlocked"}
            </Button>
          </div>

          <Separator />

          {/* Available Themes */}
          <div className="space-y-4">
            <Label className="text-base">Available Theme Options</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="light-mode">Light Mode</Label>
                <Button
                  id="light-mode"
                  variant={permissions.allowLightMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePermissionChange("allowLightMode", !permissions.allowLightMode)}
                  disabled={permissions.lockTheme}
                >
                  {permissions.allowLightMode ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Button
                  id="dark-mode"
                  variant={permissions.allowDarkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePermissionChange("allowDarkMode", !permissions.allowDarkMode)}
                  disabled={permissions.lockTheme}
                >
                  {permissions.allowDarkMode ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="system-mode">System Mode</Label>
                <Button
                  id="system-mode"
                  variant={permissions.allowSystemMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePermissionChange("allowSystemMode", !permissions.allowSystemMode)}
                  disabled={permissions.lockTheme}
                >
                  {permissions.allowSystemMode ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Default Theme */}
          <div className="space-y-4">
            <Label className="text-base">Default Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {permissions.allowLightMode && (
                <Button
                  variant={permissions.defaultTheme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    handlePermissionChange("defaultTheme", "light")
                    setTheme("light")
                  }}
                  disabled={permissions.lockTheme}
                >
                  Light
                </Button>
              )}
              {permissions.allowDarkMode && (
                <Button
                  variant={permissions.defaultTheme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    handlePermissionChange("defaultTheme", "dark")
                    setTheme("dark")
                  }}
                  disabled={permissions.lockTheme}
                >
                  Dark
                </Button>
              )}
              {permissions.allowSystemMode && (
                <Button
                  variant={permissions.defaultTheme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    handlePermissionChange("defaultTheme", "system")
                    setTheme("system")
                  }}
                  disabled={permissions.lockTheme}
                >
                  System
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Reset Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Reset all permissions to default
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetPermissions()
                setTheme("dark") // Reset to default theme
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}