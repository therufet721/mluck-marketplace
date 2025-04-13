"use client"

import dynamic from 'next/dynamic'

// Dynamically import the Web3Provider to avoid SSR issues
const Web3Provider = dynamic(
  () => import('./Web3Provider'),
  { ssr: false }
)

export default function ClientWeb3Provider({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>
} 