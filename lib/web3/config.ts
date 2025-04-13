import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bsc } from 'wagmi/chains'

// Your WalletConnect project ID (get one at https://cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_WALLET_CONNECT_PROJECT_ID'

export const config = getDefaultConfig({
  appName: 'MLuck Marketplace',
  projectId,
  chains: [bsc],
  ssr: true, // For Next.js
}) 