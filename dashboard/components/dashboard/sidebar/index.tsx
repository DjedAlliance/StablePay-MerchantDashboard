"use client"

import type * as React from "react"
import Link from "next/link" // Added Link import for proper Next.js navigation
import Image from "next/image"
import BracketsIcon from "@/components/icons/brackets" // Fixed icon imports to use individual file paths
import GearIcon from "@/components/icons/gear"
import DotsVerticalIcon from "@/components/icons/dots-vertical"
import { Bullet } from "@/components/ui/bullet"
import LockIcon from "@/components/icons/lock"
import CreditCardIcon from "@/components/icons/credit-card"
import { usePathname } from "next/navigation"

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

export function DashboardSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { walletAddress, isConnected, connectWallet, disconnectWallet } = useWallet()

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader className="rounded-t-lg flex gap-3 flex-row rounded-b-none">
        <div className="flex overflow-clip size-24 shrink-0 items-center justify-center">
          <Image
            src="/StablePay.svg"
            alt="StablePay Logo"
            width={80}
            height={80}
            className="w-16 h-16 object-contain"
          />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="text-2xl font-serif font-bold">StablePay</span>
          <span className="text-xs uppercase">Merchant Dashboard for Payment Management</span>
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
          <SidebarGroupLabel>
            <Bullet className="mr-2" />
            Merchant Address
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
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate text-xl font-display">
                            {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                          </span>
                          <span className="truncate text-xs uppercase opacity-50 group-hover/item:opacity-100 font-mono">
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
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate text-xl font-display">Connect Wallet</span>
                        <span className="truncate text-xs uppercase opacity-50 group-hover/item:opacity-100 font-mono">
                          Not Connected
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
