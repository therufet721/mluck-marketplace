'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTokenBalance, useWalletStatus } from '../lib/web3/hooks';

type ClientHeaderProps = {
  title?: string;
};

export default function ClientHeader({ title = 'Dashboard' }: ClientHeaderProps) {
  const { balance, loading } = useTokenBalance();
  const { isCorrectNetwork, switchNetwork } = useWalletStatus();
  
  return (
    <header style={{
      backgroundColor: '#0F1713',
      position: 'relative',
      height: '230px',
      overflow: 'hidden'
    }}>
      {/* Background image */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
        <Image 
          src="/HeaderBG.png"
          alt="Digital Background"
          fill
          style={{ 
            objectFit: 'cover'
          }}
        />
      </div>
      
      {/* Header content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px',
        paddingTop: '46px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
                  <Image src="/Logo.svg" alt="MLuck Logo" width={76.56999969482422} height={71.0000228881836} />
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/dashboard" style={{ 
              color: 'white', 
              textDecoration: 'none',
              fontWeight: '500',
              opacity: 0.9,
              transition: 'opacity 0.2s ease'
            }} onMouseOver={(e) => { e.currentTarget.style.opacity = '1' }}
               onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9' }}>
              Dashboard
            </Link>
            <Link href="/profile" style={{ 
              color: 'white', 
              textDecoration: 'none',
              fontWeight: '500',
              opacity: 0.9,
              transition: 'opacity 0.2s ease'
            }} onMouseOver={(e) => { e.currentTarget.style.opacity = '1' }}
               onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9' }}>
              My Properties
            </Link>
          </div>
          
          {/* Network Badge */}
          <div style={{ 
            background: isCorrectNetwork ? 'rgba(77, 209, 111, 0.2)' : 'rgba(255, 159, 0, 0.2)', 
            color: 'white',
            padding: '6px 12px', 
            borderRadius: '12px',
            marginRight: '10px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            minWidth: '120px',
            boxShadow: isCorrectNetwork 
              ? '0 2px 6px rgba(77, 209, 111, 0.3)'
              : '0 2px 6px rgba(255, 159, 0, 0.3)'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: isCorrectNetwork ? '#4BD16F' : '#FF9F00', 
              borderRadius: '50%',
              marginRight: '8px',
              boxShadow: isCorrectNetwork 
                ? '0 0 5px rgba(77, 209, 111, 0.8)'
                : '0 0 5px rgba(255, 159, 0, 0.8)'
            }}></div>
            {isCorrectNetwork 
              ? (
                <div>
                  Polygon
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Wrong Network</span>
                  <button 
                    onClick={switchNetwork}
                    style={{
                      backgroundColor: '#FF9F00',
                      color: 'white',
                      border: 'none',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    Switch to Polygon
                  </button>
                </div>
              )
            }
          </div>
          
          {/* User Balance */}
          <div style={{ 
            background: 'rgba(77, 209, 111, 0.2)', 
            color: 'white',
            padding: '8px 16px', 
            borderRadius: '12px',
            marginRight: '10px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            minWidth: '150px',
            boxShadow: '0 2px 6px rgba(77, 209, 111, 0.3)',
            opacity: balance ? 1 : 0.5,
            transition: 'opacity 0.2s ease'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#4BD16F', 
              borderRadius: '50%',
              marginRight: '8px',
              boxShadow: '0 0 5px rgba(77, 209, 111, 0.8)'
            }}></div>
            {loading ? '0.00 MLUCK' : balance || '0.00 MLUCK'}
          </div>
          
          {/* RainbowKit Connect Button */}
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '4px', 
            borderRadius: '12px',
            minWidth: '180px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
          }}>
            <ConnectButton 
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>
        </div>
        
        {/* Page title */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
} 