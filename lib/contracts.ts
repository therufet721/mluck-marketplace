import { slotAbi, marketplaceAbi } from './abi';
import { ethers } from 'ethers';

// Function to safely get checksummed address
function getChecksummedAddress(address: string) {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    console.error(`Error checksumming address ${address}:`, error);
    throw error;
  }
}

// Get marketplace address from environment variable
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;
const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
console.log("MARKETPLACE_ADDRESS:", MARKETPLACE_ADDRESS);
console.log("ENV:", env);
if (!MARKETPLACE_ADDRESS) {
  throw new Error('Marketplace address environment variable is not set');
}

// Create checksummed addresses
export const ADDRESSES = {
  get MARKETPLACE() {
    return getChecksummedAddress(MARKETPLACE_ADDRESS);
  }
};

// Types based on the contract structures
export interface Property {
  slotContract: string;
  price: bigint;
  fee: bigint;
}

export enum PropertyStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

export interface Promocode {
  percent: bigint;
  maxUse: bigint;
  maxUsePerWallet: number;
  expiresAt: bigint;
}

// Helper function to create contract instances
export async function getContracts(provider: ethers.JsonRpcProvider) {
  try {
    const marketplace = new ethers.Contract(ADDRESSES.MARKETPLACE, marketplaceAbi, provider);
    return { marketplace };
  } catch (error) {
    console.error("Error creating contract instances:", error);
    throw error;
  }
}

// Function to get contract with signer for transactions
export async function getContractsWithSigner(signer: ethers.JsonRpcSigner) {
  try {
    const marketplace = new ethers.Contract(ADDRESSES.MARKETPLACE, marketplaceAbi, signer);
    return { marketplace };
  } catch (error) {
    console.error("Error creating contract instances with signer:", error);
    throw error;
  }
}

// Function to get NFT contract
export async function getNFTContract(provider: ethers.JsonRpcProvider, nftAddress: string) {
  console.log("Creating NFT contract for address:", nftAddress);
  try {
    return new ethers.Contract(nftAddress, slotAbi, provider);
  } catch (error) {
    console.error("Error creating NFT contract:", error);
    throw error;
  }
}

// Function to get NFT contract with signer
export function getNFTContractWithSigner(signer: ethers.JsonRpcSigner, nftAddress: string) {
  return new ethers.Contract(nftAddress, slotAbi, signer);
}

// Marketplace functions
export async function getProperty(provider: ethers.JsonRpcProvider, propertyAddress: string) {
  const { marketplace } = await getContracts(provider);
  const [property, status, availableSlots] = await marketplace.getProperty(propertyAddress);
  
  // 💡 wrap BigInt arrays so callers never deal with BigInt
  return {
    property: {
      slotContract: property.slotContract,
      price: Number(property.price),
      fee: Number(property.fee),
    },
    status: Number(status) as PropertyStatus,
    availableSlots: availableSlots.map((n: bigint) => Number(n)),
  };
}

export async function getCost(provider: ethers.JsonRpcProvider, propertyAddress: string, slotsCount: number[]) {
  const { marketplace } = await getContracts(provider);
  return await marketplace.getCost(propertyAddress, slotsCount);
}

export async function buySlots(signer: ethers.JsonRpcSigner, propertyAddress: string, slots: number[]) {
  const { marketplace } = await getContractsWithSigner(signer);
  
  // Convert slot numbers to BigInt values
  const slotsBigInt = slots.map(slot => BigInt(slot));
  
  // Pass BigInt values to the contract function
  return await marketplace.buy(propertyAddress, slotsBigInt);
}

export async function getPromoCode(provider: ethers.JsonRpcProvider, promoCodeHash: string) {
  const { marketplace } = await getContracts(provider);
  const promocode = await marketplace.getPromoCode(promoCodeHash);
  return {
    percent: promocode.percent,
    maxUse: promocode.maxUse,
    maxUsePerWallet: promocode.maxUsePerWallet,
    expiresAt: promocode.expiresAt
  } as Promocode;
}

export async function getUserPromoUsage(provider: ethers.JsonRpcProvider, promoHash: string) {
  const { marketplace } = await getContracts(provider);
  return await marketplace.getUserPromoUsage(promoHash);
}

export async function getCostUsingPromo(
  provider: ethers.JsonRpcProvider, 
  propertyAddress: string, 
  slotsCount: number, 
  promoHash: string
) {
  const { marketplace } = await getContracts(provider);
  return await marketplace.getCostUsingPromo(propertyAddress, slotsCount, promoHash);
}

export async function buyWithPromo(
  signer: ethers.JsonRpcSigner,
  propertyAddress: string,
  slots: number[],
  promoHash: string,
  signature: string
) {
  const { marketplace } = await getContractsWithSigner(signer);
  return await marketplace.buyWithPromo(propertyAddress, slots, promoHash, signature);
}

// NFT (MLUCKSlot) functions
export async function getOwnedSlots(provider: ethers.JsonRpcProvider, nftAddress: string, ownerAddress: string) {
  const nftContract = await getNFTContract(provider, nftAddress);
  return await nftContract.ownedBy(ownerAddress);
}

export async function getTotalSupply(provider: ethers.JsonRpcProvider, nftAddress: string) {
  const nftContract = await getNFTContract(provider, nftAddress);
  return await nftContract.totalSupply();
}

export async function getOwnersList(provider: ethers.JsonRpcProvider, nftAddress: string) {
  const nftContract = await getNFTContract(provider, nftAddress);
  return await nftContract.getOwnersList();
}

export async function getSlotOwner(provider: ethers.JsonRpcProvider, nftAddress: string, tokenId: number) {
  const nftContract = await getNFTContract(provider, nftAddress);
  return await nftContract.ownerOf(tokenId);
}

export async function getTokenURI(provider: ethers.JsonRpcProvider, nftAddress: string, tokenId: number) {
  const nftContract = await getNFTContract(provider, nftAddress);
  return await nftContract.tokenURI(tokenId);
}

// Helper function to generate a promo code hash
export function getPromoCodeHash(promoCode: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(promoCode));
} 