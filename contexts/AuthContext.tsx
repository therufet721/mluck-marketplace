'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { switchNetwork } from '@wagmi/core';
import { polygon } from 'wagmi/chains';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  address: string | undefined;
  isWrongNetwork: boolean;
  switchNetwork: (() => Promise<void>) | undefined;
  isSwitchingNetwork: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  address: undefined,
  isWrongNetwork: false,
  switchNetwork: undefined,
  isSwitchingNetwork: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  useEffect(() => {
    // Check if connected and on the right network
    const isRightNetwork = chainId === polygon.id;
    setIsWrongNetwork(isConnected && !isRightNetwork);
    setIsAuthenticated(isConnected && isRightNetwork);
    setIsLoading(isConnecting || isSwitchingNetwork);
  }, [isConnected, isConnecting, chainId, isSwitchingNetwork]);

  const handleSwitchNetwork = async () => {
    if (!isConnected) return;
    try {
      setIsSwitchingNetwork(true);
      await switchNetwork(config, { chainId: polygon.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        address,
        isWrongNetwork,
        switchNetwork: handleSwitchNetwork,
        isSwitchingNetwork,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 