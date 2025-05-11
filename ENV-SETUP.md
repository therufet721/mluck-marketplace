# Environment Setup Guide

This application uses the Polygon Network (Chain ID: 137).

## Configuration

To configure the environment, you need to set the appropriate environment variables:

1. Create a `.env.local` file for local development or configure environment variables in your hosting platform.

2. Set the following variables:

```
# Wallet Connect Project ID (Get one at https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id

# Contract Addresses - Make sure to use the addresses deployed on Polygon network
NEXT_PUBLIC_MARKETPLACE_ADDRESS=your_marketplace_contract_address
NEXT_PUBLIC_SLOT_ADDRESS=your_slot_contract_address
NEXT_PUBLIC_TOKEN_ADDRESS=your_token_contract_address

# API Configuration
NEXT_PUBLIC_API_URL=your_api_url
```

## Deployment

### Vercel

If deploying on Vercel, you can configure environment variables in the project settings:

1. Go to your project settings in Vercel
2. Navigate to the "Environment Variables" section
3. Add the environment variables listed above

### Netlify

If deploying on Netlify:

1. Go to your site settings
2. Navigate to "Build & deploy" > "Environment"
3. Add the environment variables listed above

## Testing

To ensure your environment variables are correctly set:

1. Check the network prompt when connecting a wallet - it should show Polygon network
2. Verify that the contract addresses are correct for the Polygon network 