import React from 'react';
import Image from 'next/image';
import { formatCurrency } from '../lib/utils';
import { Property } from '../types';
import Link from 'next/link';

type PropertyCardProps = {
  isComingSoon?: boolean;
  property?: Property;
};

export default function PropertyCard({ isComingSoon = false, property }: PropertyCardProps) {
  if (isComingSoon) {
    return (
      <div style={{ 
        backgroundColor: '#4BD16F', 
        borderRadius: '1rem', 
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
        height: '100%',
        position: 'relative'
      }}>
        {/* Background pattern overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: 'url(/Properties.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1
        }} />
        
        <div style={{ marginBottom: '24px', position: 'relative', zIndex: 2 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.0099 6L11.9999 12L16.2399 16.24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '8px', position: 'relative', zIndex: 2 }}>Available Soon...</h3>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div style={{ 
      backgroundColor: '#E8FFF0', 
      borderRadius: '15px', 
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      position: 'relative',
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: '365px',
      padding: '26px'
    }}>
      {/* Property image section */}
      <div style={{ position: 'relative',  marginBottom: '20px' }}>
        <Image 
          src="/Properties.png"
          alt="Property"
          width={310}
          height={310}
          style={{ objectFit: 'cover' , borderRadius: '15px'}}
        />
      </div>
      
      {/* Property details section */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '16px', 
          color: '#000',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%'
        }}>
          {property.title}
        </h3>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '8px', 
          marginBottom: '20px', 
          fontSize: '0.95rem',
          flex: 1
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', color: '#4BD16F' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 21H21" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 21V7L13 3V21" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 21V11L13 7" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Property Type:
            </div>
            <span style={{ fontWeight: '600', color: '#333' }}>{property.type}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', color: '#4BD16F' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="#4BD16F" strokeWidth="2"/>
                </svg>
              </span>
              Stage:
            </div>
            <span style={{ fontWeight: '600', color: '#333' }}>Ready</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', color: '#4BD16F' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 22H22" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 22V6C17 4.93913 16.5786 3.92172 15.8284 3.17157C15.0783 2.42143 14.0609 2 13 2H11C9.93913 2 8.92172 2.42143 8.17157 3.17157C7.42143 3.92172 7 4.93913 7 6V22" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Rental Income:
            </div>
            <span style={{ fontWeight: '600', color: '#333' }}>Yes</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', color: '#4BD16F' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18V22" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.93 4.93L7.76 7.76" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.24 16.24L19.07 19.07" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              APY:
            </div>
            <span style={{ fontWeight: '600', color: '#333' }}>{property.apy}%</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', color: '#4BD16F' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Slot Price:
            </div>
            <span style={{ fontWeight: '600', color: '#333' }}>${property.price}</span>
          </div>
        </div>
        
        <Link href={`/property/${property.id}/purchase`} style={{ textDecoration: 'none' }}>
          <button style={{ 
            backgroundColor: '#4BD16F', 
            color: 'white', 
            width: '100%', 
            padding: '12px 0', 
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '1rem',
            transition: 'background-color 0.2s ease',
            boxShadow: '0 2px 4px rgba(75, 209, 111, 0.3)'
          }}>
            Purchase Now
          </button>
        </Link>
      </div>
    </div>
  );
} 