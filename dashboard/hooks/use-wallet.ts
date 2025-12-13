"use client"

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function useWallet() {
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()

  const connectWallet = () => {
    
    const metamask = connectors.find((c) => c.id === 'metaMask' || c.type === 'injected')
    
    
    if (metamask) {
      connect({ connector: metamask })
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] })
    } else {
      console.error("No wallet connector found")
    }
  }

  return {
    walletAddress: address,
    isConnected,
    connectWallet,
    disconnectWallet: () => disconnect(),
  }
}