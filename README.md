# MLUCK Marketplace Integration

This project integrates with MLUCK smart contracts to allow users to view and purchase slots from properties.

## Smart Contracts

The integration uses the following smart contracts:

- **MLUCKSlot**: The NFT contract that represents property slots (ERC721)
- **Marketplace**: The contract that handles slot purchases

## Contract Addresses (Testnet)

These contracts are currently deployed on the **BNB Smart Chain Testnet**:

- Token: `0xD035c1571F64f06a1856cf5f017717dDf462bA2E`
- Marketplace: `0xAe3fa7c626aBd70AdFB757d79621F28D2a399c86`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with the following content:
   ```
   NEXT_PUBLIC_SLOT_ADDRESS=0xD035c1571F64f06a1856cf5f017717dDf462bA2E
   NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xAe3fa7c626aBd70AdFB757d79621F28D2a399c86
   NEXT_PUBLIC_NETWORK=testnet
   NEXT_PUBLIC_EXPLORER_URL=https://testnet.bscscan.com
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Testnet Configuration

This project is currently configured to work with the BNB Smart Chain Testnet. Users will need:

1. MetaMask or another Web3 wallet configured with the BNB Smart Chain Testnet
2. Test BNB (tBNB) for gas fees
3. Test BUSD (tBUSD) for purchasing slots

### Adding BNB Smart Chain Testnet to MetaMask

1. Open MetaMask and go to Settings > Networks > Add Network
2. Fill in the following details:
   - Network Name: BNB Smart Chain Testnet
   - New RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
   - Chain ID: 97
   - Currency Symbol: tBNB
   - Block Explorer URL: https://testnet.bscscan.com

### Getting Test Tokens

1. Get testnet BNB from the [Binance Smart Chain Faucet](https://testnet.binance.org/faucet-smart)
2. For test BUSD, use the contract address provided by the MLUCK team

## Polygon Network Configuration

This project is configured to work with the **Polygon Mainnet**. If you're having connection issues, please follow these steps:

### Manually Adding Polygon to MetaMask

1. Open MetaMask and click on the network dropdown at the top
2. Click "Add Network" 
3. Fill in these details:
   - Network Name: Polygon Mainnet
   - New RPC URL: https://polygon-rpc.com/
   - Chain ID: 137
   - Currency Symbol: MATIC
   - Block Explorer URL: https://polygonscan.com

### Troubleshooting Network Issues

If you see "Wrong Network" messages:

1. **Your wallet shows the wrong network**: Click the "Switch to Polygon" button that appears in the app
2. **You've added Polygon but it's not connecting**: Try refreshing the page and connecting again
3. **Connection fails repeatedly**: 
   - Check MetaMask's connection settings
   - Try a different RPC URL (e.g., https://polygon-mainnet.infura.io/ if you have an Infura account)
   - Make sure you have MATIC for gas fees

### How to Verify Your Network

1. Look at the network indicator in the header - it should be green and say "Polygon"
2. Check your MetaMask network dropdown - it should say "Polygon Mainnet"
3. Verify the chain ID is 137 (you can see this in the console logs)

If you see your wallet is connected but the app still indicates you're on the wrong network, try these steps:
1. Disconnect your wallet
2. Switch to Polygon Mainnet in MetaMask
3. Refresh the page
4. Reconnect your wallet

## Features

- View property details and available slots
- Connect wallet using MetaMask or other Web3 providers
- Purchase slots using BUSD token
- Apply promo codes for discounts
- Network detection and automatic switching to BNB Smart Chain Testnet

## Troubleshooting

### Common Issues

1. **Contract Not Found Error**: Make sure you're connected to BNB Smart Chain Testnet. The app will prompt you to switch networks if needed.

2. **Transaction Failure**: This could be due to:
   - Insufficient tBNB for gas
   - Insufficient tBUSD for the purchase
   - Contract permission issues

3. **MetaMask Not Connecting**: Refresh the page and try again. Make sure you have the latest version of MetaMask.

## Implementation Details

### Contract ABIs

All contract ABIs are stored in `lib/abi.ts`:
- `slotAbi` - ABI for the MLUCKSlot contract
- `marketplaceAbi` - ABI for the Marketplace contract

### Contract Functions

Contract interaction functions are implemented in `lib/contracts.ts`:
- Property and slot information retrieval
- Slot purchase functions
- Promo code handling

### React Hooks

React hooks for easy contract integration:
- `useContracts` - Base hook for contract interaction
- `useWalletStatus` - Hook for wallet connection status
- `usePurchaseSlots` - Hook for purchasing slots
- `usePurchaseSlotsWithPromo` - Hook for purchasing slots with promo codes
- `usePropertyInfo` - Hook for getting property information

## Usage Examples

### Connect Wallet

```jsx
import { useWalletStatus } from '../lib/web3/hooks';

function WalletButton() {
  const { isConnected, address, connect } = useWalletStatus();
  
  return isConnected ? (
    <p>Connected: {address}</p>
  ) : (
    <button onClick={connect}>Connect Wallet</button>
  );
}
```

### Purchase Slots

```jsx
import { usePurchaseSlots } from '../lib/web3/hooks';

function PurchaseButton({ slotIds }) {
  const { purchaseSlots, loading, success, error } = usePurchaseSlots();
  
  const handlePurchase = async () => {
    await purchaseSlots(slotIds);
  };
  
  return (
    <div>
      <button onClick={handlePurchase} disabled={loading}>
        {loading ? 'Processing...' : 'Purchase Slots'}
      </button>
      {success && <p>Purchase successful!</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Get Owned Slots

```jsx
import { useEffect, useState } from 'react';
import { getOwnedSlots } from '../lib/slots';
import { useWalletStatus } from '../lib/web3/hooks';

function OwnedSlots() {
  const { address, isConnected } = useWalletStatus();
  const [slots, setSlots] = useState([]);
  
  useEffect(() => {
    if (isConnected && address) {
      const fetchSlots = async () => {
        const ownedSlots = await getOwnedSlots(address);
        setSlots(ownedSlots);
      };
      
      fetchSlots();
    }
  }, [isConnected, address]);
  
  return (
    <div>
      <h2>Your Slots</h2>
      {slots.length > 0 ? (
        <ul>
          {slots.map(slot => (
            <li key={slot}>Slot #{slot}</li>
          ))}
        </ul>
      ) : (
        <p>You don't own any slots yet.</p>
      )}
    </div>
  );
}
```
