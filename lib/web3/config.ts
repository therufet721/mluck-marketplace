import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { polygon } from 'wagmi/chains'

// Your WalletConnect project ID (get one at https://cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_WALLET_CONNECT_PROJECT_ID'

export const config = getDefaultConfig({
  appName: 'MLuck Marketplace',
  projectId,
  chains: [polygon],
  ssr: true, // For Next.js
}) 