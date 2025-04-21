import { ethers } from 'ethers';
import { getNFTContract, getContracts } from './contracts';
import { slotAbi } from './abi';

// Get a provider depending on environment
export function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Fallback to a public provider (read-only)
  return new ethers.JsonRpcProvider('https://polygon-rpc.com/');
}

// Get the owner of a slot
export async function getSlotOwner(nftAddress: string, slotId: number): Promise<string | null> {
  try {
    if (!window.ethereum) return null;
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(nftAddress, slotAbi, provider);
    
    const owner = await contract.ownerOf(slotId);
    return owner;
  } catch (error) {
    console.error(`Error getting owner of slot ${slotId}:`, error);
    return null;
  }
}

// Get all slots owned by an address for a specific NFT contract
export async function getOwnedSlots(nftAddress: string, ownerAddress: string): Promise<number[]> {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(nftAddress, slotAbi, provider);
    const ownedTokens = await contract.ownedBy(ownerAddress);
    return ownedTokens.map((token: bigint) => Number(token));
  } catch (error) {
    console.error(`Error getting owned slots for ${ownerAddress}:`, error);
    return [];
  }
}

// Get total supply of slots for a specific NFT contract
export async function getTotalSlots(nftAddress: string): Promise<number> {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(nftAddress, slotAbi, provider);
    console.log(contract, "contract");
    
    const totalSupply = await contract.totalSupply();
    console.log(totalSupply, "totalSuply");
    
    return Number(totalSupply);
  } catch (error) {
    console.error('Error getting total slots:', error);
    return 0;
  }
}

// Get all owners
export async function getOwnersList(nftAddress: string): Promise<string[]> {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(nftAddress, slotAbi, provider);
    return await contract.getOwnersList();
  } catch (error) {
    console.error('Error getting owners list:', error);
    return [];
  }
}

// Check if a slot is for sale
export async function isSlotForSale(nftAddress: string, tokenId: number): Promise<boolean> {
  try {
    const provider = getProvider();
    const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';
    
    if (!marketplaceAddress) {
      console.error('Marketplace address not configured');
      return false;
    }
    
    // Check if the slot is owned by the marketplace
    const owner = await getSlotOwner(nftAddress, tokenId);
    if (!owner) return false;
    
    return owner.toLowerCase() === marketplaceAddress.toLowerCase();
  } catch (error) {
    console.error(`Error checking if slot ${tokenId} is for sale:`, error);
    return false;
  }
}

// Get slot balance for an address
export async function getSlotBalance(address: string, nftAddress: string): Promise<number> {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(nftAddress, slotAbi, provider);
    const balance = await contract.balanceOf(address);
    return Number(balance);
  } catch (error) {
    console.error(`Error getting slot balance for ${address}:`, error);
    return 0;
  }
}

// Get payment token address
export async function getPaymentToken(nftAddress: string): Promise<string | null> {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(nftAddress, slotAbi, provider);
    return await contract.token();
  } catch (error) {
    console.error('Error fetching token address:', error);
    return null;
  }
}

/**
 * @deprecated Use getMarketplaceAvailableSlots instead - this expensive fallback is no longer needed
 * as we now query the marketplace contract directly
 */
export const getAvailableSlots = undefined as never;

// Get available slots directly from marketplace contract
export async function getMarketplaceAvailableSlots(
  propertyAddress: string
): Promise<number[]> {
  try {
    const provider = getProvider();                 // BrowserProvider or JSON-RPC
    // Type assertion needed since getContracts can handle both provider types
    const { marketplace } = await getContracts(provider as ethers.JsonRpcProvider);
    console.log(marketplace,"marketplace = getmarketplaceavailable");
    
    const [property, status, availableSlotsRaw] = 
      await marketplace.getProperty(propertyAddress);

    if (Number(status) !== 1) {
      // status 1 == ACTIVE. 0 == INACTIVE (not for sale yet)
      throw new Error('Property is not active for sale');
    }

    const availableSlots = availableSlotsRaw.map((n: bigint) => Number(n));
    // availableSlots now contains ONLY the IDs you can buy
    
    if (availableSlots.length === 0) {
      console.warn('Marketplace returned 0 available slots');
    }
    console.log('getProperty raw →', { status: Number(status), available: availableSlotsRaw.map(Number) })

    return availableSlots;
  } catch (error) {
    console.error('Error fetching available slots from marketplace:', error);
    return [];
  }
}

export async function getUserOwnedSlots(slotContractAddress: string, userAddress: string): Promise<number[]> {
  try {
    const provider = getProvider();
    // Type assertion needed since getNFTContract can handle both provider types
    const slotContract = await getNFTContract(provider as ethers.JsonRpcProvider, slotContractAddress);
    
    // Call the ownedBy function on the slot contract
    const ownedSlotsBigInt = await slotContract.ownedBy(userAddress);
    console.log(ownedSlotsBigInt);
    
    
    // Convert BigInt values to numbers
    return ownedSlotsBigInt.map((slotId: bigint) => Number(slotId));
  } catch (error) {
    console.error('Error fetching owned slots:', error);
    return [];
  }
}


