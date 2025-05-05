import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig } from 'wagmi';
import { polygon, bsc } from 'wagmi/chains';
import {
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  binanceWallet,
  trustWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { http } from 'viem';

// Your WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'a936392574f639a268ff81897035b673';

// Determine environment: use BNB Chain for production, Polygon for test
const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

// Create custom wallet list with connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        binanceWallet,
        rainbowWallet,
        coinbaseWallet,
        trustWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'MLuck Marketplace',
    projectId,
  }
);

// Create configuration with custom wallet list
export const config = createConfig({
  connectors,
  // Specify the chains in a tuple format to satisfy the type requirements
  chains: isProd ? [bsc, polygon] as const : [polygon, bsc] as const,
  transports: {
    [bsc.id]: http(),
    [polygon.id]: http(),
  },
  ssr: true,
}); 