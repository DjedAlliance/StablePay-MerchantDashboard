import type React from "react"
import NumberFlow from "@number-flow/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bullet } from "@/components/ui/bullet"
import { cn } from "@/lib/utils"

interface DashboardStatProps {
  label: string
  value: string
  description?: string
  tag?: string
  icon: React.ElementType
  intent?: "positive" | "negative" | "neutral"
  direction?: "up" | "down"
}

export default function DashboardStat({ label, value, description, icon, tag, intent, direction }: DashboardStatProps) {
  const Icon = icon

  // Extract prefix, numeric value, and suffix from the value string
  const parseValue = (val: string) => {
    // Match pattern: optional prefix + number + optional suffix
    const match = val.match(/^([^\d.-]*)([+-]?\d*\.?\d+)([^\d]*)$/)

    if (match) {
      const [, prefix, numStr, suffix] = match
      return {
        prefix: prefix || "",
        numericValue: Number.parseFloat(numStr),
        suffix: suffix || "",
        isNumeric: !isNaN(Number.parseFloat(numStr)),
      }
    }

    return {
      prefix: "",
      numericValue: 0,
      suffix: val,
      isNumeric: false,
    }
  }

  const getIntentClassName = () => {
    if (intent === "positive") return "text-success"
    if (intent === "negative") return "text-destructive"
    return "text-muted-foreground"
  }

  const { prefix, numericValue, suffix, isNumeric } = parseValue(value)

  return (
    <Card className="relative overflow-hidden min-h-[200px] pt-4 space-y-2">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2.5 w-full text-base">
          <Bullet />
          {label}
        </CardTitle>
        <Icon className="size-5 text-muted-foreground" />
      </CardHeader>

      <CardContent className="bg-accent flex-1 pt-4 md:pt-8 pb-6 overflow-clip relative">
        <div className="flex items-center">
          <span className="text-5xl md:text-6xl font-display">
            {isNumeric ? <NumberFlow value={numericValue} prefix={prefix} suffix={suffix} /> : value}
          </span>
          {tag && (
            <Badge variant="default" className="uppercase ml-3">
              {tag}
            </Badge>
          )}
        </div>

        {description && (
          <div className="justify-between mt-2">
            <p className="text-sm md:text-base font-medium text-muted-foreground tracking-wide">{description}</p>
          </div>
        )}

        {/* Marquee Animation */}
        {direction && (
          <div className="absolute top-0 right-0 w-14 h-full pointer-events-none overflow-hidden group">
            <div
              className={cn(
                "flex flex-col transition-all duration-500",
                "group-hover:scale-105 group-hover:brightness-110",
                getIntentClassName(),
                direction === "up" ? "animate-marquee-up" : "animate-marquee-down",
              )}
            >
              <div className={cn("flex", direction === "up" ? "flex-col-reverse" : "flex-col")}>
                {Array.from({ length: 6 }, (_, i) => (
                  <Arrow key={i} direction={direction} index={i} />
                ))}
              </div>
              <div className={cn("flex", direction === "up" ? "flex-col-reverse" : "flex-col")}>
                {Array.from({ length: 6 }, (_, i) => (
                  <Arrow key={i} direction={direction} index={i} />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ArrowProps {
  direction: "up" | "down"
  index: number
}

const Arrow = ({ direction, index }: ArrowProps) => {
  const staggerDelay = index * 0.15 // Faster stagger
  const phaseDelay = (index % 3) * 0.8 // Different phase groups

  return (
    <span
      style={{
        animationDelay: `${staggerDelay + phaseDelay}s`,
        animationDuration: "3s",
        animationTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      }}
      className={cn(
        "text-center text-5xl size-14 font-display leading-none block",
        "transition-all duration-700 ease-out",
        "animate-marquee-pulse",

        "will-change-transform",
      )}
    >
      {direction === "up" ? "↑" : "↓"}
    </span>
  )
}
