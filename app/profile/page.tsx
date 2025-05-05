'use client'

import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { getOwnedSlots, getUserOwnedSlots } from '../../lib/slots'
import { useProperties } from '../../contexts/PropertiesContext'
import { Property } from '../../types'

// Simplified property card that directly shows slots
function SimplePropertyCard({ property, userAddress }: { property: Property, userAddress: string }) {
  const [ownedSlots, setOwnedSlots] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [flippedSlots, setFlippedSlots] = useState<Record<number, boolean>>({})
  
  // Toggle flip state for a slot
  const toggleFlip = (slotId: number) => {
    setFlippedSlots(prev => ({
      ...prev,
      [slotId]: !prev[slotId]
    }))
  }
  
  useEffect(() => {
    // Handle responsive layout
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIfMobile()
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])
  
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const slots = await getUserOwnedSlots(property.slotContract, userAddress)
        setOwnedSlots(slots)
      } catch (err) {
        console.error('Error fetching slots:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSlots()
  }, [property.slotContract, userAddress])
  
  return (
    <div style={{ 
      backgroundColor: '#E8FFF0', 
      borderRadius: '12px', 
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      padding: '15px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ 
        fontSize: '1rem', 
        fontWeight: 'bold', 
        color: '#333',
        margin: '0 0 12px 0'
      }}>
        {property.title}
      </h3>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '15px' : '0'
      }}>
        {/* Left side - Image */}
        <div style={{ 
          flex: isMobile ? '1' : '0 0 120px',
          alignSelf: isMobile ? 'center' : 'auto'
        }}>
          <Image 
            src={property.imageUrl || "/Properties.png"}
            alt={property.title}
            width={120}
            height={100}
            style={{ 
              objectFit: 'cover', 
              borderRadius: '8px'
            }}
          />
        </div>
        
        {/* Middle - Property Info */}
        <div style={{ 
          flex: '1',
          paddingLeft: isMobile ? '0' : '15px',
          paddingRight: isMobile ? '0' : '15px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Asset valuation:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
              ${!loading && property.price ? (Number(property.price) * ownedSlots.length).toFixed(2) : '...'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Number of slots:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{loading ? '...' : ownedSlots.length}</span>
          </div>
          
          {!loading && ownedSlots.length > 0 && (
            <div style={{ marginTop: '5px' }}>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '5px',
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                {ownedSlots.map(slotId => (
                  <div 
                    key={slotId}
                    style={{
                      position: 'relative',
                      width: '40px',
                      height: '60px',
                      marginBottom: '8px',
                      perspective: '1000px',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleFlip(slotId)}
                  >
                    {/* Flip container */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '40px',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s',
                        transform: flippedSlots[slotId] ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = 'rotateY(180deg)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile && !flippedSlots[slotId]) {
                          e.currentTarget.style.transform = 'rotateY(0deg)';
                        }
                      }}
                    >
                      {/* Front side - SVG */}
                      <div 
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          backfaceVisibility: 'hidden',
                          backgroundImage: `url('/images/BAK-KR1.svg')`,
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                      
                      {/* Back side - ID Number */}
                      <div
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          backgroundImage: `url('/images/BAK-KR1.svg')`,
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: 'transparent',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'black',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        >
                          {slotId}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right side - Accumulated Income */}
        <div style={{
          flex: isMobile ? '1' : '0 0 120px',
          borderLeft: isMobile ? 'none' : '1px solid #E0E0E0',
          borderTop: isMobile ? '1px solid #E0E0E0' : 'none',
          paddingLeft: isMobile ? '0' : '15px',
          paddingTop: isMobile ? '15px' : '0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>
            Accumulated Income:
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            fontWeight: 'bold', 
            color: '#333', 
            marginBottom: '10px',
            filter: 'blur(4px)',
            userSelect: 'none'
          }}>
            0.00 USDT
          </div>
          <div style={{ 
            backgroundColor: '#f0f0f0', 
            color: '#999', 
            border: 'none',
            borderRadius: '20px',
            padding: '5px 15px',
            fontSize: '0.85rem',
            fontWeight: '500',
            cursor: 'not-allowed'
          }}>
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { properties: allProperties, loading: propertiesLoading, error: propertiesError } = useProperties()
  const [ownedProperties, setOwnedProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOwnedProperties() {
      if (!address || !isConnected || propertiesLoading) {
        setOwnedProperties([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Use properties from context instead of API call
        const ownedProperties = []
        for (const property of allProperties) {
          try {
            const ownedSlotIds = await getOwnedSlots(property.slotContract, address)
            if (ownedSlotIds.length > 0) {
              ownedProperties.push(property)
            }
          } catch (error) {
            console.error(`Error fetching owned slots for property ${property.id}:`, error)
          }
        }
        
        setOwnedProperties(ownedProperties)
      } catch (error) {
        console.error('Error processing owned properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOwnedProperties()
  }, [address, isConnected, allProperties, propertiesLoading])

  if (propertiesError) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        <Header />
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'red' }}>
            <p>Error loading properties: {propertiesError.message}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Header />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
            My Properties
          </h2>
          {isConnected ? (
            <p style={{ color: '#666' }}>
              Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          ) : (
            <p style={{ color: '#666' }}>
              Connect your wallet to view your properties
            </p>
          )}
        </div>
        
        {loading || propertiesLoading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p>Loading your properties...</p>
          </div>
        ) : (
          <>
            {ownedProperties.length > 0 ? (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginBottom: '64px'
              }}>
                {ownedProperties.map((property) => (
                  <div key={property.id}>
                    <SimplePropertyCard 
                      property={property} 
                      userAddress={address || ''}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <p>You don't own any properties yet.</p>
                <div style={{ marginTop: '16px' }}>
                  <a 
                    href="/dashboard" 
                    style={{
                      backgroundColor: '#4BD16F',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    Browse Available Properties
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
} 