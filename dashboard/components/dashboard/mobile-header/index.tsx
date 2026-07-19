import Image from "next/image"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggleSimple } from "@/components/theme-toggle-simple"
import { TextSizeControl } from "@/components/text-size-control"

export function MobileHeader() {
  return (
    <div className="lg:hidden h-header-mobile sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 relative">
        <SidebarTrigger />
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <div className="h-8 w-16 flex items-center justify-center">
            <Image
              src="/StablePay.svg"
              alt="StablePay Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
          </div>
          <span className="text-lg font-display tracking-tight">StablePay</span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-0.5">
          <TextSizeControl />
          <ThemeToggleSimple />
        </div>
      </div>
    </div>
  )
}
