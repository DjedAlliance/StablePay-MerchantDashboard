import Image from "next/image"
import { ThemeToggleSimple } from "@/components/theme-toggle-simple"

export function MobileHeader() {
  return (
    <div className="lg:hidden h-header-mobile sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-elevated">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Empty space for balance */}
        <div className="w-8"></div>
        
        {/* Center: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 flex items-center justify-center">
              <Image
                src="/StablePay.svg"
                alt="StablePay Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* Right: Theme Toggle */}
        <ThemeToggleSimple />
      </div>
    </div>
  )
}
