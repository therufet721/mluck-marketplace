'use client'

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../../lib/web3/config'
import '@rainbow-me/rainbowkit/styles.css'

// Create a client for React Query
const queryClient = new QueryClient()

interface Web3ProviderProps {
  children: React.ReactNode
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#4BD16F', // Primary green color
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small'
          })}
          modalSize="compact"
          appInfo={{
            appName: 'MLuck Marketplace',
            // Ensure wallet connections prefer native apps when available
            // This is especially important for mobile wallet connections
            learnMoreUrl: 'https://www.binance.com/en/wallet-direct'
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 