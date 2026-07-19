import type React from "react"
import NumberFlow from "@number-flow/react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
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

  const { prefix, numericValue, suffix, isNumeric } = parseValue(value)

  // `intent` is optional, so anything other than positive/negative falls back
  // to the neutral styling rather than rendering an uncolored pill.
  const trendPillClassName =
    intent === "positive"
      ? "bg-success/10 text-success"
      : intent === "negative"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground"

  return (
    <Card className="group relative overflow-hidden shadow-card hover:shadow-elevated transition-shadow duration-300">
      <CardHeader className="flex items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
          <Bullet />
          {label}
        </CardTitle>
        <Icon className="size-5 text-muted-foreground" />
      </CardHeader>

      <CardContent className="bg-card flex-1 pt-5 md:pt-6 pb-6 overflow-clip relative">
        <div className="flex items-end gap-3">
          <span className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums leading-none">
            {isNumeric ? <NumberFlow value={numericValue} prefix={prefix} suffix={suffix} /> : value}
          </span>
          {tag && (
            <Badge variant="default" className="uppercase mb-1">
              {tag}
            </Badge>
          )}
          {direction && (
            <span
              className={cn(
                "mb-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                trendPillClassName,
              )}
            >
              {direction === "up" ? (
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="size-3.5" aria-hidden="true" />
              )}
              <span className="sr-only">
                {direction === "up" ? "Trending up" : "Trending down"}
              </span>
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2.5 text-sm font-medium text-muted-foreground tracking-wide">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
