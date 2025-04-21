# MLuck Marketplace

MLuck Marketplace is a decentralized platform for purchasing and managing property slots on the Polygon network. This platform allows users to invest in real estate properties by purchasing slots using BUSD tokens.

## Features

- **Property Slot Purchase**: Users can purchase multiple slots for properties listed on the marketplace
- **Real-time Updates**: Live updates of slot availability and transaction status
- **Wallet Integration**: Seamless connection with Web3 wallets
- **BUSD Integration**: Purchase slots using BUSD tokens on the Polygon network
- **Interactive UI**: User-friendly interface with visual slot selection
- **Transaction Management**: Complete transaction flow with approval and confirmation steps

## Prerequisites

- Node.js (v14 or higher)
- A Web3 wallet (e.g., MetaMask)
- BUSD tokens on Polygon network
- Access to Polygon network

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd mluck-marketplace
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_EXPLORER_URL=https://polygonscan.com
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Usage

1. **Connect Wallet**
   - Click the "Connect Wallet" button
   - Ensure you're connected to the Polygon network
   - Make sure you have sufficient BUSD tokens

2. **Purchase Slots**
   - Browse available properties
   - Select the property you want to invest in
   - Click on available slots to select them
   - Review the total cost (price + fees)
   - Approve BUSD spending (first-time only)
   - Confirm the purchase

3. **Transaction Monitoring**
   - Track transaction status in real-time
   - View transaction details on Polygonscan
   - Receive confirmation of successful purchases

## Smart Contract Integration

The marketplace interacts with the following smart contracts:
- Property Contract: Manages property listings and slot ownership
- BUSD Token Contract: Handles token approvals and transfers
- Marketplace Contract: Manages the purchase transactions

## Technical Stack

- **Frontend**: Next.js, React
- **Blockchain**: Ethereum/Polygon
- **Smart Contracts**: Solidity
- **Web3 Integration**: ethers.js
- **Styling**: CSS-in-JS

## Development

### Project Structure
```
mluck-marketplace/
├── app/
│   ├── property/
│   │   └── [id]/
│   │       └── purchase/
│   │           └── page.tsx
├── components/
│   └── Header.tsx
├── lib/
│   ├── contracts/
│   ├── slots/
│   └── web3/
│       └── hooks/
└── public/
```

### Key Components

- `property/[id]/purchase/page.tsx`: Main property slot purchase interface
- `lib/web3/hooks`: Custom hooks for Web3 functionality
- `lib/slots`: Slot management utilities
- `lib/contracts`: Smart contract interactions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.
