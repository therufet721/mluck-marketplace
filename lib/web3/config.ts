import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig } from 'wagmi';
import { polygon } from 'wagmi/chains';
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

// Always use Polygon chain
const chains = [polygon] as const;

// Create custom wallet list with connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        binanceWallet,
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
        trustWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'Mluck Marketplace',
    projectId,
  }
);

// Create configuration with custom wallet list
export const config = createConfig({
  connectors,
  chains,
  transports: {
    [polygon.id]: http(),
  },
  ssr: true,
});

export { chains }; 