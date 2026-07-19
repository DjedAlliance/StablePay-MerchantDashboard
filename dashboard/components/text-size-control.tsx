"use client"

import * as React from "react"
import { Type } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FONT_SCALE_OPTIONS, useFontScale } from "@/hooks/use-font-scale"

export function TextSizeControl({ className }: { className?: string }) {
  const { fontScale, setFontScale, mounted } = useFontScale()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8 text-muted-foreground hover:text-foreground", className)}
          aria-label="Adjust text size"
          title="Adjust text size"
        >
          <Type className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2">
        <div className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Text size
        </div>
        <div className="grid grid-cols-1 gap-1">
          {FONT_SCALE_OPTIONS.map((option) => {
            const isActive = mounted && fontScale === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFontScale(option.value)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    option.value === "sm" && "text-sm",
                    option.value === "base" && "text-base",
                    option.value === "lg" && "text-lg",
                    option.value === "xl" && "text-xl",
                  )}
                >
                  {option.label}
                </span>
                {isActive && <span className="size-1.5 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
