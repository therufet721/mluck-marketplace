'use client'

import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
import PropertyCard from '../../components/PropertyCard'
import { useAccount } from 'wagmi'
import { getOwnedSlots } from '../../lib/slots'
import { getProperties } from '../../lib/api'
import { Property } from '../../types'

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const [ownedProperties, setOwnedProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOwnedProperties() {
      if (!address || !isConnected) {
        setOwnedProperties([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Fetch owned slot IDs from the blockchain
        const ownedSlotIds = await getOwnedSlots(address)
        
        // Fetch all properties from the API
        const allProperties = await getProperties()
        
        // Filter properties to only include the ones owned by the user
        const userProperties = allProperties.filter(property => 
          ownedSlotIds.some(slotId => slotId.toString() === property.id)
        )
        
        setOwnedProperties(userProperties)
      } catch (error) {
        console.error('Error fetching owned properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOwnedProperties()
  }, [address, isConnected])

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
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p>Loading your properties...</p>
          </div>
        ) : (
          <>
            {ownedProperties.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '32px',
                marginBottom: '64px'
              }}>
                {ownedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
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