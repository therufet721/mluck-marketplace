'use client'

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../../lib/web3/config'
import '@rainbow-me/rainbowkit/styles.css'
import { useState, useEffect } from 'react'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      staleTime: 10000
    }
  }
})

interface Web3ProviderProps {
  children: React.ReactNode
}

export default function Web3Provider({ children }: Web3ProviderProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if environment variables are set correctly
    if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
      console.warn('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set!');
    }
  }, []);

  // If there's an error with web3 providers, we show a fallback UI instead of failing
  if (hasError) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Web3 Connection Issue</h2>
        <p>There was a problem connecting to Web3 services. You can still browse the site, but wallet connectivity may be limited.</p>
        {errorMessage && (
          <p style={{ color: 'red', fontSize: '14px' }}>{errorMessage}</p>
        )}
        {children}
      </div>
    );
  }

  try {
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
              appName: 'Mluck Marketplace',
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
  } catch (error) {
    console.error('Error in Web3Provider:', error);
    setHasError(true);
    setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    return <>{children}</>;
  }
} 