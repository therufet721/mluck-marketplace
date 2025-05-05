'use client';

import React from 'react';
import { useWalletStatus } from '../lib/web3/hooks';

// Determine environment
const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
const networkName = isProd ? 'BNB Smart Chain' : 'Polygon Network';
const networkChainId = isProd ? 56 : 137;

export default function ForceNetworkSwitch() {
  const { isConnected, isCorrectNetwork, switchNetwork, chainId } = useWalletStatus();
  
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
        style={{
          backgroundColor: 'white',
          color: '#FF9F00',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%',
          fontSize: '16px',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => { 
          e.currentTarget.style.backgroundColor = '#f5f5f5';
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseOut={(e) => { 
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Switch to {networkName}
      </button>
      
      <div style={{ marginTop: '15px', fontSize: '12px', opacity: 0.8 }}>
        <p>If switching doesn't work, please manually select {networkName} in your wallet</p>
      </div>
    </div>
  );
} 