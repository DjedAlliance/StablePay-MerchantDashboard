"use client"

import * as React from "react"
import Link from "next/link" // Added Link import for proper Next.js navigation
import Image from "next/image"
import BracketsIcon from "@/components/icons/brackets" // Fixed icon imports to use individual file paths
import GearIcon from "@/components/icons/gear"
import DotsVerticalIcon from "@/components/icons/dots-vertical"
import { Bullet } from "@/components/ui/bullet"
import LockIcon from "@/components/icons/lock"
import CreditCardIcon from "@/components/icons/credit-card"
import { usePathname } from "next/navigation"
import { ThemeToggleSimpleClick } from "@/components/theme-toggle-simple-click"
import { TextSizeControl } from "@/components/text-size-control"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useWallet } from "@/hooks/use-wallet"
import { PlusIcon, MinusIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// This is sample data for the sidebar
const data = {
  navMain: [
    {
      title: "Tools",
      items: [
        {
          title: "Overview",
          url: "/",
          icon: BracketsIcon,
        },
        {
          title: "Transactions",
          url: "/transactions",
          icon: CreditCardIcon,
        },
        {
          title: "Admin Settings",
          url: "/admin",
          icon: GearIcon,
          locked: true,
        },
      ],
    },
  ],
  desktop: {
    title: "Desktop (Online)",
    status: "online",
  },
}

function AddAddressDialog() {
  const [open, setOpen] = React.useState(false)
  const [address, setAddress] = React.useState("")
  const [error, setError] = React.useState("")
  const { addAddress, additionalAddresses } = useWallet()

  const handleAdd = () => {
    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!evmAddressRegex.test(address)) {
      setError("Invalid EVM address")
      return
    }
    if (additionalAddresses.some(a => a.toLowerCase() === address.toLowerCase())) {
      setError("Address already added")
      return
    }
    addAddress(address)
    setAddress("")
    setError("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setAddress("")
        setError("")
      }
    }}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Add merchant address"
          className="text-sidebar-foreground hover:text-sidebar-accent-foreground flex items-center justify-center p-1 rounded hover:bg-sidebar-accent transition-colors"
        >
          <PlusIcon className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Merchant Address</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input 
            placeholder="0x..." 
            value={address} 
            onChange={(e) => {
              setAddress(e.target.value)
              setError("")
            }} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
          {error && <span className="text-red-500 text-sm">{error}</span>}
          <Button onClick={handleAdd}>Add Address</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DashboardSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { walletAddress, isConnected, connectWallet, disconnectWallet, additionalAddresses, removeAddress } = useWallet()

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader className="rounded-t-lg rounded-b-none gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex shrink-0 items-center justify-center">
            <Image
              src="/StablePay.svg"
              alt="StablePay Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="grid flex-1 text-left leading-tight min-w-0">
            <span className="text-xl font-display tracking-tight truncate">StablePay</span>
            <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground truncate">
              Merchant Payments
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-0.5 border-t border-sidebar-border/60 pt-1.5">
          <TextSizeControl />
          <ThemeToggleSimpleClick />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {data.navMain.map((group, i) => (
          <SidebarGroup className={cn(i === 0 && "rounded-t-none")} key={group.title}>
            <SidebarGroupLabel>
              <Bullet className="mr-2" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className={cn(item.locked && "pointer-events-none opacity-50")}
                    data-disabled={item.locked}
                  >
                    <SidebarMenuButton
                      asChild={!item.locked}
                      isActive={pathname === item.url} // Use pathname to determine active state dynamically
                      disabled={item.locked}
                      className={cn("disabled:cursor-not-allowed", item.locked && "pointer-events-none")}
                    >
                      {item.locked ? (
                        <div className="flex items-center gap-3 w-full">
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <Link href={item.url}>
                          {" "}
                          {/* Changed from <a> to <Link> for proper Next.js navigation */}
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                    {item.locked && (
                      <SidebarMenuBadge>
                        <LockIcon className="size-5 block" />
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between w-full pr-2">
            <span className="flex items-center">
              <Bullet className="mr-2" />
              Merchant Address
            </span>
            <AddAddressDialog />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {isConnected && walletAddress ? (
                  <Popover>
                    <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
                      <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <CreditCardIcon className="size-8" />
                      </div>
                      <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground">
                        <div className="grid flex-1 text-left leading-tight min-w-0">
                          <span className="truncate text-base font-mono font-medium">
                            {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                          </span>
                          <span className="truncate text-[0.65rem] uppercase tracking-wide opacity-60 group-hover/item:opacity-100">
                            Connected
                          </span>
                        </div>
                        <DotsVerticalIcon className="ml-auto size-4" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0" side="bottom" align="end" sideOffset={4}>
                      <div className="flex flex-col">
                        <button
                          onClick={() => disconnectWallet()}
                          className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                        >
                          <CreditCardIcon className="mr-2 h-4 w-4" />
                          Disconnect
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <button
                    onClick={() => connectWallet()}
                    className="flex gap-0.5 w-full group cursor-pointer"
                  >
                    <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <CreditCardIcon className="size-8" />
                    </div>
                    <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded">
                      <div className="grid flex-1 text-left leading-tight min-w-0">
                        <span className="truncate text-base font-semibold">Connect Wallet</span>
                        <span className="truncate text-[0.65rem] uppercase tracking-wide opacity-60 group-hover/item:opacity-100">
                          Not Connected
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </SidebarMenuItem>
              {additionalAddresses.map((addr) => (
                <SidebarMenuItem key={addr}>
                  <div className="flex gap-0.5 w-full group">
                    <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <CreditCardIcon className="size-8" />
                    </div>
                    <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded">
                      <div className="grid flex-1 text-left leading-tight min-w-0">
                        <span className="truncate text-base font-mono font-medium">
                          {`${addr.slice(0, 6)}...${addr.slice(-4)}`}
                        </span>
                        <span className="truncate text-[0.65rem] uppercase tracking-wide opacity-60 group-hover/item:opacity-100">
                          Added
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAddress(addr)}
                        className="ml-auto p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10 rounded text-muted-foreground hover:text-red-500"
                        title="Remove address"
                        aria-label={`Remove address ${addr}`}
                      >
                        <MinusIcon className="size-5" />
                      </button>
                    </div>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
