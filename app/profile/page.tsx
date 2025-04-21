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
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left side - Image */}
        <div style={{ flex: '0 0 120px' }}>
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
          paddingLeft: '15px',
          paddingRight: '15px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Asset valuation:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>${property.price}</span>
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
                gap: '5px'
              }}>
                {ownedSlots.map(slotId => (
                  <div 
                    key={slotId}
                    style={{
                      width: '25px',
                      height: '25px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: '#4BD16F',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '11px'
                    }}
                  >
                    {slotId}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right side - Accumulated Income */}
        <div style={{
          flex: '0 0 120px',
          borderLeft: '1px solid #E0E0E0',
          paddingLeft: '15px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>
            Accumulated Income:
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            2.87 USDT
          </div>
          <button style={{ 
            backgroundColor: '#4BD16F', 
            color: 'white', 
            border: 'none',
            borderRadius: '20px',
            padding: '5px 15px',
            fontSize: '0.85rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Claim
          </button>
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