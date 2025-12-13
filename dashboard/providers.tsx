"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { config } from "@/lib/wagmi-config"
import { TransactionProvider } from "@/contexts/TransactionContext"

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TransactionProvider>
          {children}
        </TransactionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
