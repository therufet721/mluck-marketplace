'use client';

import { useNetworkChangeEffect } from '../lib/web3/hooks';

export default function NetworkChangeHandler() {
  // This component doesn't render anything visible
  // It just sets up the network change effect
  useNetworkChangeEffect();
  
  return null;
} 