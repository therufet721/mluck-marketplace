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
  isSwitchingNetwork: boolean;
  switchNetwork?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  address: undefined,
  isWrongNetwork: false,
  isSwitchingNetwork: false,
  switchNetwork: undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  // Add switchNetwork function
  const handleSwitchNetwork = async () => {
    try {
      setIsSwitchingNetwork(true);
      await switchNetwork(config, { chainId: polygon.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  // Automatically switch network when connected to wrong network
  useEffect(() => {
    const handleNetworkSwitch = async () => {
      const isRightNetwork = chainId === polygon.id;
      if (isConnected && !isRightNetwork && !isSwitchingNetwork) {
        await handleSwitchNetwork();
      }
      setIsWrongNetwork(isConnected && !isRightNetwork);
      setIsAuthenticated(isConnected && isRightNetwork);
      setIsLoading(isConnecting || isSwitchingNetwork);
    };

    handleNetworkSwitch();
  }, [isConnected, chainId, config, isConnecting, isSwitchingNetwork]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        address,
        isWrongNetwork,
        isSwitchingNetwork,
        switchNetwork: handleSwitchNetwork,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 