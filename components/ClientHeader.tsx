'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTokenBalance, useWalletStatus } from '../lib/web3/hooks';
import { useMobile } from '../contexts/MobileContext';

type ClientHeaderProps = {
  title?: string;
};

export default function ClientHeader({ title = 'Dashboard' }: ClientHeaderProps) {
  const { balance, loading } = useTokenBalance();
  const { isCorrectNetwork, connectedChain } = useWalletStatus();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMobile } = useMobile();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);
  
  return (
    <>
      {/* Mobile Side Menu */}
      {isMobile && (
        <>
          {/* Overlay */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 100,
              opacity: isMobileMenuOpen ? 1 : 0,
              visibility: isMobileMenuOpen ? 'visible' : 'hidden',
              transition: 'opacity 0.3s ease, visibility 0.3s ease',
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Side Menu */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '300px',
            backgroundColor: '#0F1713',
            zIndex: 101,
            transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                alignSelf: 'flex-end',
                padding: '10px',
                marginBottom: '20px'
              }}
            >
              ✕
            </button>

            {/* Navigation Links */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <Link 
                href="/dashboard" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  fontSize: '18px',
                  fontWeight: '500',
                  padding: '10px 0'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/profile" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  fontSize: '18px',
                  fontWeight: '500',
                  padding: '10px 0'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Properties
              </Link>
            </div>

            {/* Network Badge */}
            {connectedChain && (
              <div style={{ 
                background: isCorrectNetwork ? 'rgba(77, 209, 111, 0.2)' : 'rgba(255, 159, 0, 0.2)', 
                color: 'white',
                padding: '12px', 
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '15px',
                boxShadow: isCorrectNetwork 
                  ? '0 2px 6px rgba(77, 209, 111, 0.3)'
                  : '0 2px 6px rgba(255, 159, 0, 0.3)'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center'
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
                  }}/>
                  {connectedChain}
                </div>
              </div>
            )}

            {/* User Balance */}
            <div style={{ 
              background: 'rgba(77, 209, 111, 0.2)', 
              color: 'white',
              padding: '12px', 
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '15px',
              boxShadow: '0 2px 6px rgba(77, 209, 111, 0.3)',
              opacity: balance ? 1 : 0.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: '#4BD16F', 
                  borderRadius: '50%',
                  marginRight: '8px',
                  boxShadow: '0 0 5px rgba(77, 209, 111, 0.8)'
                }}/>
                {loading ? '0.00 MLUCK' : balance || '0.00 MLUCK'}
              </div>
            </div>

            {/* RainbowKit Connect Button */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '4px', 
              borderRadius: '12px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
            }}>
              <ConnectButton 
                showBalance={false}
                chainStatus="icon"
                accountStatus="avatar"
              />
            </div>
          </div>
        </>
      )}

      <header style={{
        backgroundColor: '#0F1713',
        position: 'relative',
        height: isMobile ? '180px' : '230px',
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
          padding: isMobile ? '12px' : '16px',
          paddingTop: isMobile ? '20px' : '46px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '20px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Image 
                  src="/Logo.svg" 
                  alt="MLuck Logo" 
                  width={isMobile ? 60 : 76.57} 
                  height={isMobile ? 56 : 71} 
                />
              </Link>
            </div>

            {isMobile ? (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ☰
              </button>
            ) : (
              <>
                {/* Desktop Navigation */}
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
                {connectedChain && (
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
                    }}/>
                    {connectedChain}
                  </div>
                )}

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
                  }}/>
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
              </>
            )}
          </div>
          
          {/* Page title */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: isMobile ? '20px' : '30px'
          }}>
            <h1 style={{
              color: 'white',
              fontSize: isMobile ? '1.75rem' : '2.5rem',
              fontWeight: 'bold',
              margin: 0,
              textAlign: 'center',
              padding: '0 15px'
            }}>
              {title}
            </h1>
          </div>
        </div>
      </header>
    </>
  );
} 