# Environment Setup Guide

This application supports two environments:
- **Test Environment**: Using Polygon Network (Chain ID: 137)
- **Production Environment**: Using BNB Chain (Chain ID: 56)

## Configuration

To configure the environment, you need to set the appropriate environment variables:

1. Create a `.env.local` file for local development or configure environment variables in your hosting platform.

2. Set the following variables:

```
# Application Environment - Set to 'production' for BNB Chain, anything else for Polygon (test)
NEXT_PUBLIC_ENVIRONMENT=production

# Wallet Connect Project ID (Get one at https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id

# Contract Addresses - Make sure to use the addresses deployed on the correct network
NEXT_PUBLIC_MARKETPLACE_ADDRESS=your_marketplace_contract_address
NEXT_PUBLIC_SLOT_ADDRESS=your_slot_contract_address
NEXT_PUBLIC_TOKEN_ADDRESS=your_token_contract_address

# API Configuration
NEXT_PUBLIC_API_URL=your_api_url
```

## Environment Selection

- For **Test Environment** (Polygon Network): Set `NEXT_PUBLIC_ENVIRONMENT` to any value except "production" (e.g., "development", "test", or leave it empty)
  
- For **Production Environment** (BNB Chain): Set `NEXT_PUBLIC_ENVIRONMENT=production`

## Deployment

### Vercel

If deploying on Vercel, you can configure environment variables in the project settings:

1. Go to your project settings in Vercel
2. Navigate to the "Environment Variables" section
3. Add the environment variables listed above
4. For different environments (preview, development, production), you can configure specific values

### Netlify

If deploying on Netlify:

1. Go to your site settings
2. Navigate to "Build & deploy" > "Environment"
3. Add the environment variables listed above

## Testing

To ensure your environment variables are correctly set:

1. Check the network prompt when connecting a wallet - it should show the correct network
2. Verify transactions are being processed on the expected network
3. If users experience network mismatch errors, double-check that the application is configured correctly for the intended environment 