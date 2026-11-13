"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProtocol } from "@/hooks/use-protocol"
import { PROTOCOLS, isProtocol } from "@/lib/config"
import type { Protocol } from "@/lib/config"
import { cn } from "@/lib/utils"

interface ProtocolSwitchProps {
  className?: string
  disabled?: boolean
}

export default function ProtocolSwitch({ className, disabled }: ProtocolSwitchProps) {
  const { protocol, setProtocol } = useProtocol()

  const handleChange = (value: string) => {
    if (isProtocol(value)) setProtocol(value)
  }

  return (
    <Tabs value={protocol} onValueChange={handleChange} className={cn("gap-0", className)}>
      <TabsList aria-label="Protocol">
        {(Object.keys(PROTOCOLS) as Protocol[]).map((id) => (
          <TabsTrigger key={id} value={id} disabled={disabled} className="uppercase">
            {PROTOCOLS[id].name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
