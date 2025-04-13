'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';

type ClientHeaderProps = {
  title?: string;
};

export default function ClientHeader({ title = 'Dashboard' }: ClientHeaderProps) {
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