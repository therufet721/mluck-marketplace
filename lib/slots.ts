import { contract } from './contract'

export async function getSlotOwner(slotId: number) {
  try {
    return await contract.read.ownerOf(slotId)
  } catch (err) {
    return null
  }
}

export async function isSlotSold(slotId: number, marketplaceAddress: string) {
  const owner = await getSlotOwner(slotId)
  return owner?.toLowerCase() !== marketplaceAddress.toLowerCase()
}

export async function getOwnedSlots(address: string) {
  try {
    return await contract.read.ownedBy(address as `0x${string}`)
  } catch (err) {
    console.error('Error fetching owned slots:', err)
    return []
  }
}

export async function getSlotBalance(address: string) {
  try {
    return await contract.read.balanceOf(address as `0x${string}`)
  } catch (err) {
    console.error('Error fetching balance:', err)
    return BigInt(0)
  }
}

export async function getPaymentToken() {
  try {
    return await contract.read.token()
  } catch (err) {
    console.error('Error fetching token address:', err)
    return null
  }
} 