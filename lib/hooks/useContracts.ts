import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import * as contracts from '../contracts';
import { useProperties } from '../../contexts/PropertiesContext'; // Fix import path
import { Property } from '../../types'; // Import Property type
import { useAccount, useWalletClient, useChainId, useConnect, useDisconnect } from 'wagmi';

export function useContracts() {
  const { properties } = useProperties();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const { address: account, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { connectAsync, connectors } = useConnect();
  const [propertyAddresses, setPropertyAddresses] = useState<{ [key: string]: string }>({});

  // Initialize provider and set property addresses from context
  useEffect(() => {
    // Set property addresses from context
    const addresses = properties.reduce((acc: { [key: string]: string }, property: Property) => ({
      ...acc,
      [property.address]: property.address
    }), {});
    setPropertyAddresses(addresses);

    // Initialize provider and signer when walletClient is available
    const initProviderAndSigner = async () => {
      if (walletClient && isConnected) {
        try {
          // Create provider from walletClient's transport
          const ethersProvider = new ethers.BrowserProvider(walletClient.transport);
          const ethersSigner = await ethersProvider.getSigner();
          
          setProvider(ethersProvider);
          setSigner(ethersSigner);
        } catch (error) {
          console.error('Error initializing provider and signer:', error);
        }
      } else {
        setSigner(null);
      }
    };

    initProviderAndSigner();
  }, [properties, walletClient, isConnected]);

  // Function to manually connect wallet
  const connectWallet = useCallback(async () => {
    try {
      // Connect using the first available connector
      if (connectors.length > 0) {
        await connectAsync({ connector: connectors[0] });
      }
      
      if (walletClient && isConnected) {
        // Create provider from walletClient's transport
        const ethersProvider = new ethers.BrowserProvider(walletClient.transport);
        const ethersSigner = await ethersProvider.getSigner();
        
        setProvider(ethersProvider);
        setSigner(ethersSigner);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error connecting to wallet', error);
      return false;
    }
  }, [connectAsync, connectors, walletClient, isConnected]);

  // Marketplace functions with proper error handling
  const getProperty = useCallback(async (propertyAddress: string) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      // BrowserProvider extends JsonRpcProvider, so it's compatible
      return await contracts.getProperty(provider as unknown as ethers.JsonRpcProvider, propertyAddress);
    } catch (error) {
      console.error('Error getting property:', error);
      throw error;
    }
  }, [provider]);

  const getCost = useCallback(async (propertyAddress: string, slotsCount: number[]) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getCost(provider as unknown as ethers.JsonRpcProvider, propertyAddress, slotsCount);
    } catch (error) {
      console.error('Error getting cost:', error);
      throw error;
    }
  }, [provider]);

  const buySlots = useCallback(async (propertyAddress: string, slots: number[]) => {
    if (!signer) throw new Error('Signer not initialized');
    try {
      return await contracts.buySlots(signer, propertyAddress, slots);
    } catch (error) {
      console.error('Error buying slots:', error);
      throw error;
    }
  }, [signer]);

  const getPromoCode = useCallback(async (promoCodeHash: string) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getPromoCode(provider as unknown as ethers.JsonRpcProvider, promoCodeHash);
    } catch (error) {
      console.error('Error getting promo code:', error);
      throw error;
    }
  }, [provider]);

  const getUserPromoUsage = useCallback(async (promoHash: string) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getUserPromoUsage(provider as unknown as ethers.JsonRpcProvider, promoHash);
    } catch (error) {
      console.error('Error getting user promo usage:', error);
      throw error;
    }
  }, [provider]);

  const getCostUsingPromo = useCallback(async (propertyAddress: string, slotsCount: number, promoHash: string) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getCostUsingPromo(
        provider as unknown as ethers.JsonRpcProvider, 
        propertyAddress, 
        slotsCount, 
        promoHash
      );
    } catch (error) {
      console.error('Error getting cost using promo:', error);
      throw error;
    }
  }, [provider]);

  const buyWithPromo = useCallback(async (
    propertyAddress: string, 
    slots: number[], 
    promoHash: string, 
    signature: string
  ) => {
    if (!signer) throw new Error('Signer not initialized');
    try {
      return await contracts.buyWithPromo(signer, propertyAddress, slots, promoHash, signature);
    } catch (error) {
      console.error('Error buying with promo:', error);
      throw error;
    }
  }, [signer]);

  // NFT (MLUCKSlot) functions
  const getOwnedSlots = useCallback(async (nftAddress: string, ownerAddress: string) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getOwnedSlots(
        provider as unknown as ethers.JsonRpcProvider, 
        nftAddress, 
        ownerAddress
      );
    } catch (error) {
      console.error('Error getting owned slots:', error);
      throw error;
    }
  }, [provider]);

  const getTotalSupply = useCallback(async (nftAddress: string) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getTotalSupply(provider as unknown as ethers.JsonRpcProvider, nftAddress);
    } catch (error) {
      console.error('Error getting total supply:', error);
      throw error;
    }
  }, [provider]);

  const getOwnersList = useCallback(async (nftAddress: string) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getOwnersList(provider as unknown as ethers.JsonRpcProvider, nftAddress);
    } catch (error) {
      console.error('Error getting owners list:', error);
      throw error;
    }
  }, [provider]);

  const getSlotOwner = useCallback(async (nftAddress: string, tokenId: number) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getSlotOwner(provider as unknown as ethers.JsonRpcProvider, nftAddress, tokenId);
    } catch (error) {
      console.error('Error getting slot owner:', error);
      throw error;
    }
  }, [provider]);

  const getTokenURI = useCallback(async (nftAddress: string, tokenId: number) => {
    if (!provider) throw new Error('Provider not initialized');
    try {
      return await contracts.getTokenURI(provider as unknown as ethers.JsonRpcProvider, nftAddress, tokenId);
    } catch (error) {
      console.error('Error getting token URI:', error);
      throw error;
    }
  }, [provider]);

  // Helper function
  const getPromoCodeHash = useCallback((promoCode: string) => {
    return contracts.getPromoCodeHash(promoCode);
  }, []);

  return {
    provider,
    signer,
    account,
    isConnected,
    chainId,
    connectWallet,
    propertyAddresses,
    getProperty,
    getCost,
    buySlots,
    getPromoCode,
    getUserPromoUsage,
    getCostUsingPromo,
    buyWithPromo,
    getOwnedSlots,
    getTotalSupply,
    getOwnersList,
    getSlotOwner,
    getTokenURI,
    getPromoCodeHash,
  };
} 