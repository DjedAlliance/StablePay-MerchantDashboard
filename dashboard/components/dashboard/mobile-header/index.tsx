import Image from "next/image"

export function MobileHeader() {
  return (
    <div className="lg:hidden h-header-mobile sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-center px-4 py-3">
        {/* Center: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 flex items-center justify-center">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/StablePay.svg`}
                alt="StablePay Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
