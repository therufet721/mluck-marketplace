import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import * as contracts from '../contracts';
import { useProperties } from '../../contexts/PropertiesContext'; // Fix import path
import { Property } from '../../types'; // Import Property type

export function useContracts() {
  const { properties } = useProperties();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [propertyAddresses, setPropertyAddresses] = useState<{ [key: string]: string }>({});

  // Initialize provider and set property addresses from context
  useEffect(() => {
    const init = async () => {
      // Set property addresses from context
      const addresses = properties.reduce((acc: { [key: string]: string }, property: Property) => ({
        ...acc,
        [property.address]: property.address
      }), {});
      setPropertyAddresses(addresses);

      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          const ethersSigner = await ethersProvider.getSigner();
          const network = await ethersProvider.getNetwork();

          setProvider(ethersProvider);
          setSigner(ethersSigner);
          setAccount(accounts[0]);
          setChainId(Number(network.chainId));
          setIsConnected(true);
        } catch (error) {
          console.error('Error connecting to MetaMask', error);
          setIsConnected(false);
        }
      } else {
        console.log('Please install MetaMask!');
        setIsConnected(false);
      }
    };

    init();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setIsConnected(false);
          setAccount(null);
          setSigner(null);
        } else {
          setAccount(accounts[0]);
          if (provider) {
            const newSigner = await provider.getSigner();
            setSigner(newSigner);
            setIsConnected(true);
          }
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', async (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        try {
          // Reload provider and signer on chain change
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          const ethersSigner = await ethersProvider.getSigner();
          setProvider(ethersProvider);
          setSigner(ethersSigner);
          
          // Update connection status
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error updating provider after chain change:', error);
        }
      });
    }

    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [properties]); // Add properties as dependency

  // Function to manually connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        const ethersSigner = await ethersProvider.getSigner();
        const network = await ethersProvider.getNetwork();

        setProvider(ethersProvider);
        setSigner(ethersSigner);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        setIsConnected(true);
        return true;
      } catch (error) {
        console.error('Error connecting to wallet', error);
        return false;
      }
    } else {
      console.log('Please install MetaMask!');
      return false;
    }
  }, []);

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