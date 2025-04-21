'use client';

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWalletStatus } from '../../lib/web3/hooks';
import { getNFTContract } from '../../lib/contracts';
import { getProvider, getUserOwnedSlots } from '../../lib/slots';

interface OwnedSlotsProps {
  propertyAddress: string;
  slotContractAddress: string;
}

export default function OwnedSlots({ propertyAddress, slotContractAddress }: OwnedSlotsProps) {
  const { address, isConnected } = useWalletStatus();
  const [ownedSlots, setOwnedSlots] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOwnedSlots = async () => {
      if (!isConnected || !address || !slotContractAddress) {
        setOwnedSlots([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get slots owned by the user using the imported function
        const slots = await getUserOwnedSlots(slotContractAddress, address);
        
        setOwnedSlots(slots);
      } catch (err: any) {
        console.error('Error fetching owned slots:', err);
        setError(err.message || 'Failed to fetch owned slots');
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedSlots();
  }, [address, isConnected, slotContractAddress]);

  if (loading) {
    return <div>Loading your slots...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (ownedSlots.length === 0) {
    return <div>You don't own any slots for this property.</div>;
  }

  return (
    <div>
      <h3>Your Slots for Property {propertyAddress}</h3>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px',
        marginTop: '10px'
      }}>
        {ownedSlots.map(slotId => (
          <div 
            key={slotId}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: '#4BD16F',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {slotId}
          </div>
        ))}
      </div>
    </div>
  );
} 