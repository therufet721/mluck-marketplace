import { Property } from '../types';

// This would be replaced with actual API calls to your backend
const API_URL = 'https://chain.mluck.io';

// Determine environment
const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

// Chain IDs
const BSC_CHAIN_ID = 56;
const POLYGON_CHAIN_ID = 137;

// Get the current chain ID based on environment
const getChainId = () => isProd ? BSC_CHAIN_ID : POLYGON_CHAIN_ID;

export async function getProperties(city?: string): Promise<Property[]> {
  try {
    const chainId = getChainId();
    let url = `${API_URL}/api/v1/asset/properties?chain_id=${chainId}`;
    
    // Add city filter parameter if provided
    if (city && city !== 'All') {
      url += `&city=${encodeURIComponent(city)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.properties.map((property: any) => ({
      id: property.address,
      address: property.address,
      title: property.name,
      type: property.type,
      rental_income: property.rental_income === 1 ? "Yes" : "No",
      apy: property.apy,
      price: property.price,
      slotContract: property.address, // Use the property address as the slot contract address
    }));
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const properties = await getProperties();
  return properties.find(property => property.id === id) || null;
}

export async function getClaimableAssets(holderAddress: string): Promise<any> {
  try {
    const chainId = getChainId();
    const response = await fetch(`${API_URL}/api/v1/asset/claimable/${holderAddress}?chain_id=${chainId}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching claimable assets:", error);
    return { claimables: [], pending_claims: [] };
  }
}

export async function getClaimHistory(accountAddress: string, signature: string): Promise<any> {
  try {
    const chainId = getChainId();
    const response = await fetch(`${API_URL}/api/v1/asset/claim-history/${accountAddress}?chain_id=${chainId}`, {
      headers: {
        'Authorization': `Bearer ${signature}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.claim_history;
  } catch (error) {
    console.error("Error fetching claim history:", error);
    return [];
  }
}

export async function claimAsset(property: string, signature: string): Promise<any> {
  try {
    const chainId = getChainId();
    const message = JSON.stringify({ property });
    
    const response = await fetch(`${API_URL}/api/v1/asset/claim?chain_id=${chainId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        signature
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error claiming asset:", error);
    throw error;
  }
}

export async function claimAllAssets(holderAddress: string, signature: string): Promise<any> {
  try {
    const chainId = getChainId();
    const message = JSON.stringify({ holder: holderAddress });
    
    const response = await fetch(`${API_URL}/api/v1/asset/claimall?chain_id=${chainId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        signature
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error claiming all assets:", error);
    throw error;
  }
}

export async function getPropertySlots(propertyAddress: string): Promise<any> {
  try {
    const chainId = getChainId();
    const response = await fetch(`${API_URL}/api/v1/asset/${propertyAddress}/slots?chain_id=${chainId}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.slots;
  } catch (error) {
    console.error("Error fetching property slots:", error);
    return [];
  }
} 