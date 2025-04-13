'use client'

import { useAccount, useWalletClient, useReadContract } from 'wagmi'
import { ethers } from 'ethers'
import { useState, useEffect } from 'react'
import { getClaimableAssets, getClaimHistory, claimAsset, claimAllAssets } from '../api'
import { publicClient } from '../contract'
import { yourNFTAbi } from '../abi'

// Hook to get the connected wallet status
export function useWalletStatus() {
  const { address, isConnected, status } = useAccount()
  
  return {
    isConnected,
    address,
    connectionStatus: status
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

// Hook to purchase NFT slots
export function usePurchaseSlots() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`
  
  const purchaseSlots = async (slotIds: number[]) => {
    if (!address || !isConnected || !walletClient) {
      throw new Error('Wallet not connected')
    }
    
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      setTxHash(null)
      
      // Get the token contract address from the NFT contract
      const tokenAddress = await publicClient.readContract({
        address: contractAddress,
        abi: yourNFTAbi,
        functionName: 'token'
      }) as `0x${string}`
      
      // Price is 100 USDT per slot
      const pricePerSlot = BigInt(100 * 10**18) // Assuming USDT has 18 decimals
      const totalPrice = pricePerSlot * BigInt(slotIds.length)
      
      // First, approve token spending (ERC20 approval)
      // We'll need to use a basic ERC20 ABI for the approval
      const erc20Abi = [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }]
        }
      ] as const
      
      // Approve the token spending
      const approvalHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [contractAddress, totalPrice]
      })
      
      // Wait for approval to be confirmed
      await publicClient.waitForTransactionReceipt({ hash: approvalHash })
      
      // Now mint the slots one by one
      // Since we don't have a bulk purchase function in the ABI, we'll mint them individually
      let mintHash
      
      // Create a basic mint ABI (common in NFT contracts)
      const mintAbi = [
        {
          name: 'mint',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'tokenId', type: 'uint256' }
          ],
          outputs: []
        }
      ] as const
      
      // For each slot, perform the mint operation
      for (const slotId of slotIds) {
        mintHash = await walletClient.writeContract({
          address: contractAddress,
          abi: mintAbi,
          functionName: 'mint',
          args: [BigInt(slotId)]
        })
      }
      
      // Set the last mint transaction hash for tracking
      if (mintHash) {
        setTxHash(mintHash)
        
        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash: mintHash })
        
        if (receipt.status === 'success') {
          setSuccess(true)
        } else {
          setError('Transaction failed')
        }
      }
      
      return { hash: mintHash, success: true }
    } catch (error: any) {
      console.error('Error purchasing slots:', error)
      setError(error.message || 'Failed to purchase slots')
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  return {
    purchaseSlots,
    loading,
    success,
    error,
    txHash
  }
} 