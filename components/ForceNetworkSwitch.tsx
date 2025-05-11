'use client';

import React, { useState } from 'react';
import { useWalletStatus } from '../lib/web3/hooks';

const networkName = 'Polygon Network';
const networkChainId = 137;

export default function ForceNetworkSwitch() {
  const { isConnected, isCorrectNetwork, switchNetwork, chainId } = useWalletStatus();
  const [isHovered, setIsHovered] = useState(false);
  
  if (!isConnected || isCorrectNetwork) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(255, 159, 0, 0.95)',
      color: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      maxWidth: '400px',
      width: '90%',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '15px', 
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" />
          <path d="M12 8V12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1" fill="white" />
        </svg>
        Network Mismatch Detected
      </div>
      
      <div style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.6' }}>
        <p>You are currently connected to <b>chain ID: {chainId}</b></p>
        <p>This application requires <b>{networkName} (chain ID: {networkChainId})</b></p>
        <p style={{ marginTop: '10px' }}>Please switch your network to continue.</p>
      </div>
      
      <button
        onClick={switchNetwork}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isHovered ? '#f0f0f0' : 'white',
          color: '#FF9F00',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        Switch to {networkName}
      </button>
    </div>
  );
} 