'use client'

import { useAccount, useWalletClient, useReadContract, useDisconnect, useChainId, useConfig } from 'wagmi'
import { ethers } from 'ethers'
import { useState, useEffect, useCallback } from 'react'
import { getClaimableAssets, getClaimHistory, claimAsset, claimAllAssets } from '../api'
import { ADDRESSES } from '../contracts'
import { useContracts } from '../hooks/useContracts'
import { marketplaceAbi } from '../abi'

// Chain IDs
const POLYGON_CHAIN_ID = 137;
const POLYGON_MUMBAI_CHAIN_ID = 80001;

// Set the active network
const ACTIVE_CHAIN_ID = POLYGON_CHAIN_ID;

// Hook for handling network changes
export function useNetworkChangeEffect() {
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  
  useEffect(() => {
    // Store the current chainId in a ref to detect changes
    const savedChainId = localStorage.getItem('current-chain-id');
    
    // If we have a previous chain ID saved and it's different, reload the page
    if (savedChainId && parseInt(savedChainId) !== chainId) {
      window.location.reload();
    }
    
    // Save the current chain ID
    localStorage.setItem('current-chain-id', chainId.toString());
  }, [chainId]);
}

// Function to get chain configuration
function getChainConfig(chainId: number) {
  switch(chainId) {
    case POLYGON_CHAIN_ID:
      return {
        chainId: '0x89', // 137 in hex
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/'],
      };
    case POLYGON_MUMBAI_CHAIN_ID:
      return {
        chainId: '0x13881', // 80001 in hex
        chainName: 'Polygon Mumbai Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
      };
    default:
      throw new Error(`Chain ID ${chainId} not supported`);
  }
}

// Function to switch to the correct network
async function switchToCorrectNetwork(walletClient: any) {
  if (!walletClient) return false;
  
  try {
    // Try to switch to the correct network using walletClient
    if (walletClient.switchChain) {
      await walletClient.switchChain({ id: ACTIVE_CHAIN_ID });
      return true;
    } else {
      // Fallback for older versions or compatibility
      console.error('switchChain not available on walletClient');
      return false;
    }
  } catch (switchError: any) {
    console.error('Error switching to Polygon network:', switchError);
    return false;
  }
}

// Hook for wallet connection status
export function useWalletStatus() {
  const { account, isConnected, connectWallet } = useContracts()
  
  // Handler for connecting wallet
  const handleConnect = useCallback(async () => {
    return await connectWallet()
  }, [connectWallet])
  
  return {
    address: account,
    isConnected,
    connect: handleConnect
  }
}

// Hook to get claimable assets for the connected address
export function useClaimableAssets() {
  const { address, isConnected } = useAccount()
  const [claimables, setClaimables] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const fetchClaimables = async () => {
    if (!address || !isConnected) return
    
    try {
      setLoading(true)
      const result = await getClaimableAssets(address)
      setClaimables(result.claimables || [])
      setPending(result.pending_claims || [])
    } catch (error) {
      console.error('Error fetching claimable assets:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchClaimables()
  }, [address, isConnected])
  
  return {
    claimables,
    pendingClaims: pending,
    loading,
    refetch: fetchClaimables
  }
}

// Hook to claim assets
export function useClaimAsset() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [loading, setLoading] = useState(false)
  
  const claim = async (propertyAddress: string) => {
    if (!address || !isConnected || !walletClient) {
      throw new Error('Wallet not connected')
    }
    
    try {
      setLoading(true)
      
      // Create the message object
      const message = JSON.stringify({ property: propertyAddress })
      
      // Sign the message
      const signature = await walletClient.signMessage({ 
        message,
        account: address
      })
      
      // Call the API
      const result = await claimAsset(propertyAddress, signature)
      return result
    } catch (error) {
      console.error('Error claiming asset:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  const claimAll = async () => {
    if (!address || !isConnected || !walletClient) {
      throw new Error('Wallet not connected')
    }
    
    try {
      setLoading(true)
      
      // Create the message object
      const message = JSON.stringify({ holder: address })
      
      // Sign the message
      const signature = await walletClient.signMessage({ 
        message,
        account: address
      })
      
      // Call the API
      const result = await claimAllAssets(address, signature)
      return result
    } catch (error) {
      console.error('Error claiming all assets:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  return {
    claim,
    claimAll,
    loading
  }
}

// Hook to get claim history
export function useClaimHistory() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const fetchHistory = async () => {
    if (!address || !isConnected || !walletClient) return
    
    try {
      setLoading(true)
      
      // Sign a message to authenticate
      const signature = await walletClient.signMessage({ 
        message: `Get claim history for ${address}`,
        account: address
      })
      
      const result = await getClaimHistory(address, signature)
      setHistory(result || [])
    } catch (error) {
      console.error('Error fetching claim history:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (address && isConnected && walletClient) {
      fetchHistory()
    }
  }, [address, isConnected, walletClient])
  
  return {
    history,
    loading,
    refetch: fetchHistory
  }
}

// Hook to purchase slots
export function usePurchaseSlots() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const purchaseSlots = async (propertyAddress: string, slots: number[]) => {
    if (!isConnected || !walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setTxHash(null);

      // Create contract instance using walletClient.transport
      const provider = new ethers.BrowserProvider(walletClient.transport);
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(
        ADDRESSES.MARKETPLACE,
        marketplaceAbi,
        signer
      );

      // Convert number array to BigInt array
      const slotsBigInt = slots.map(slot => BigInt(slot));
      
      // Call buy function with property address and slots as BigInt
      const tx = await marketplaceContract.buy(propertyAddress, slotsBigInt);
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      await tx.wait();
      setSuccess(true);
    } catch (err: any) {
      console.error('Error purchasing slots:', err);
      setError(err.message || 'Error purchasing slots');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    purchaseSlots,
    loading,
    success,
    error,
    txHash
  };
}

// Hook for purchasing slots with promo code
export function usePurchaseSlotsWithPromo() {
  const { buyWithPromo, getPromoCodeHash } = useContracts()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const { approve, checkAllowance } = useTokenApproval()
  
  // Reset state
  const reset = useCallback(() => {
    setLoading(false)
    setSuccess(false)
    setError(null)
    setTxHash(null)
  }, [])
  
  // Purchase slots with promo code
  const purchaseWithPromo = useCallback(async (
    propertyAddress: string,
    slotIds: number[],
    promoHash: string,
    signature: string,
    tokenAmount?: number
  ) => {
    if (!slotIds.length) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Import ethers for checksumming
      const ethers = await import('ethers')
      
      // Checksum the property address
      const checksummedPropertyAddress = ethers.getAddress(propertyAddress)
      

      
      if (!checksummedPropertyAddress) {
        throw new Error('Property address not configured')
      }
      
      // Check token allowance if tokenAmount is provided
      if (tokenAmount) {
        const spenderAddress = ADDRESSES.MARKETPLACE
        const allowance = await checkAllowance(spenderAddress)
        
        if (allowance !== null) {
          const currentAllowance = parseFloat(allowance)
          
          // If current allowance is less than required amount, request approval
          if (currentAllowance < tokenAmount) {
            await approve(spenderAddress, tokenAmount)
          } else {
            console.log(`Current allowance (${currentAllowance}) is sufficient for purchase (${tokenAmount})`)
          }
        }
      }
    
      
      const tx = await buyWithPromo(checksummedPropertyAddress, slotIds, promoHash, signature)
      setTxHash(tx.hash)
      
      // Wait for transaction to be mined
      await tx.wait()
      
      setSuccess(true)
    } catch (err: any) {
      console.error('Error purchasing slots with promo:', err)
      setError(err?.message || 'Failed to purchase slots with promo code')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }, [buyWithPromo, checkAllowance, approve])
  
  return {
    purchaseWithPromo,
    loading,
    success,
    error,
    txHash,
    reset
  }
}

// Hook for getting property information
export function usePropertyInfo(propertyAddress: string) {
  const { getProperty } = useContracts()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyAddress) return
      
      try {
        setLoading(true)
        setError(null)
        
        const propertyInfo = await getProperty(propertyAddress)
        setProperty(propertyInfo)
      } catch (err: any) {
        console.error('Error fetching property info:', err)
        setError(err?.message || 'Failed to fetch property information')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProperty()
  }, [propertyAddress, getProperty])
  
  return {
    property,
    loading,
    error
  }
}

// Hook for getting token balance
export function useTokenBalance() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchBalance = useCallback(async () => {
    if (!address || !isConnected || !walletClient) {
      setBalance(null);
      
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Import ethers directly here to avoid circular dependencies
      const ethers = await import('ethers');
      
      // Get the token address
      const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
      
      if (!tokenAddress) {
        throw new Error('Token address not configured');
      }
      
      // Basic ERC20 ABI - just what we need to get balance
      const abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)"
      ];
      
      try {
        // Create provider from walletClient's transport
        const provider = new ethers.BrowserProvider(walletClient.transport);
        
        // Ensure addresses are properly checksummed
        const checksummedTokenAddress = ethers.getAddress(tokenAddress);
        const checksummedAccount = ethers.getAddress(address);
        
        // Create a contract instance using the provider
        const tokenContract = new ethers.Contract(checksummedTokenAddress, abi, provider);
        
        // Get token info
        const balanceBN = await tokenContract.balanceOf(checksummedAccount);
        const decimals = await tokenContract.decimals();
        const symbol = await tokenContract.symbol();
        
        // Format the balance
        const formattedBalance = ethers.formatUnits(balanceBN, decimals);
        
        setBalance(`${formattedBalance} ${symbol}`);
      } catch (checksumError: any) {
        console.error('useTokenBalance: Error with address checksum:', checksumError);
        setError('Invalid address format');
        return;
      }
    } catch (err: any) {
      console.error('useTokenBalance: Error fetching token balance:', err);
      setError(err?.message || 'Failed to fetch token balance');
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, walletClient]);
  
  // Fetch balance immediately when account or connection status changes
  useEffect(() => {
    if (isConnected && address && walletClient) {
      console.log('useTokenBalance: Connection detected, fetching initial balance');
      fetchBalance();
    }
  }, [isConnected, address, walletClient, fetchBalance]);

  // Set up polling for balance updates
  useEffect(() => {
    if (!isConnected || !address || !walletClient) return;

    console.log('useTokenBalance: Setting up balance polling');
    const interval = setInterval(fetchBalance, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isConnected, address, walletClient, fetchBalance]);
  
  return {
    balance,
    loading,
    error,
    refetch: fetchBalance
  };
}

// Hook for token approval
export function useTokenApproval() {
  const { signer, isConnected, account } = useContracts();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<string | null>(null);

  const checkAllowance = useCallback(async (spenderAddress: string) => {
    if (!isConnected || !account || !walletClient) return null;

    try {
      const ethers = await import('ethers');
      const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
      
      if (!tokenAddress) {
        throw new Error('Token address not configured');
      }

      try {
        console.log('Checking allowance for:', {
          tokenAddress,
          spenderAddress,
          owner: account
        });

        // Get the checksummed addresses
        const checksummedTokenAddress = ethers.getAddress(tokenAddress);
        const checksummedSpender = ethers.getAddress(spenderAddress);
        const checksummedOwner = ethers.getAddress(account);

        // Create provider from walletClient's transport
        const provider = new ethers.BrowserProvider(walletClient.transport);
        const signer = await provider.getSigner();

        // Basic ERC20 ABI for approval functions
        const abi = [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)",
          "function decimals() view returns (uint8)"
        ];

        const tokenContract = new ethers.Contract(checksummedTokenAddress, abi, signer);
        const currentAllowance = await tokenContract.allowance(checksummedOwner, checksummedSpender);
        const decimals = await tokenContract.decimals();
        
        const formattedAllowance = ethers.formatUnits(currentAllowance, decimals);
       
        setAllowance(formattedAllowance);
        return formattedAllowance;
      } catch (checksumError: any) {
        console.error('Error with address checksum:', checksumError);
        console.error('Failed addresses:', {
          tokenAddress,
          spenderAddress,
          owner: account
        });
        setError('Invalid address format');
        return null;
      }
    } catch (err: any) {
      console.error('Error checking allowance:', err);
      setError(err?.message || 'Failed to check allowance');
      return null;
    }
  }, [account, isConnected, walletClient]);

  const approve = useCallback(async (spenderAddress: string, amount: number) => {
    if (!isConnected || !account || !walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const ethers = await import('ethers');
      const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
      
      if (!tokenAddress) {
        throw new Error('Token address not configured');
      }

      try {
        console.log('Approving tokens:', {
          tokenAddress,
          spenderAddress,
          amount,
          owner: account
        });

        // Get the checksummed addresses
        const checksummedTokenAddress = ethers.getAddress(tokenAddress);
        const checksummedSpender = ethers.getAddress(spenderAddress);

        // Create provider from walletClient's transport
        const provider = new ethers.BrowserProvider(walletClient.transport);
        const signer = await provider.getSigner();

        // Basic ERC20 ABI for approval
        const abi = [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function decimals() view returns (uint8)"
        ];

        const tokenContract = new ethers.Contract(checksummedTokenAddress, abi, signer);
        const decimals = await tokenContract.decimals();
        
        // Convert amount to proper decimals
        const amountWithDecimals = ethers.parseUnits(amount.toString(), decimals);
        
        // Send approval transaction
        const tx = await tokenContract.approve(checksummedSpender, amountWithDecimals);
      
        await tx.wait();

        // Update allowance after approval
        await checkAllowance(checksummedSpender);
        
        return true;
      } catch (checksumError: any) {
        console.error('Error with address checksum:', checksumError);
        console.error('Failed addresses:', {
          tokenAddress,
          spenderAddress,
          owner: account
        });
        throw new Error('Invalid address format');
      }
    } catch (err: any) {
      console.error('Error approving tokens:', err);
      setError(err?.message || 'Failed to approve tokens');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, isConnected, walletClient, checkAllowance]);

  return {
    approve,
    checkAllowance,
    loading,
    error,
    allowance
  };
} 
