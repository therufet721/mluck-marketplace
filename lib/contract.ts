import { createPublicClient, http } from 'viem'
import { bsc } from 'viem/chains'
import { yourNFTAbi } from './abi'

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

export const publicClient = createPublicClient({
  chain: bsc,
  transport: http(),
})

export const contract = {
  read: {
    ownerOf: (id: number) => publicClient.readContract({
      address: contractAddress,
      abi: yourNFTAbi,
      functionName: 'ownerOf',
      args: [BigInt(id)]
    }),
    balanceOf: (address: `0x${string}`) => publicClient.readContract({
      address: contractAddress,
      abi: yourNFTAbi,
      functionName: 'balanceOf',
      args: [address]
    }),
    token: () => publicClient.readContract({
      address: contractAddress,
      abi: yourNFTAbi,
      functionName: 'token'
    }),
    // if custom
    ownedBy: (address: `0x${string}`) => publicClient.readContract({
      address: contractAddress,
      abi: yourNFTAbi,
      functionName: 'ownedBy',
      args: [address]
    })
  }
} 