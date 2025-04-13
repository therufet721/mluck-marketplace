'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSlotOwner } from '../../../../lib/slots';
import { useWalletStatus, usePurchaseSlots } from '../../../../lib/web3/hooks';
import Header from '../../../../components/Header';

export default function PropertyPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const [slots, setSlots] = useState<Array<{ id: number; isSold: boolean }>>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseStep, setPurchaseStep] = useState<'select' | 'confirm' | 'processing' | 'success' | 'error'>('select');
  
  // Get wallet connection status
  const { isConnected, address } = useWalletStatus();
  
  // Get purchase functionality
  const { 
    purchaseSlots, 
    loading: purchaseLoading, 
    success: purchaseSuccess, 
    error: purchaseError,
    txHash
  } = usePurchaseSlots();

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        // Create an array of 100 slots
        const slotsPromises = Array.from({ length: 100 }, async (_, index) => {
          const id = index + 1;
          // Check if the slot is already owned
          const owner = await getSlotOwner(id);
          return { id, isSold: owner !== null };
        });
        
        const slotsData = await Promise.all(slotsPromises);
        setSlots(slotsData);
      } catch (error) {
        console.error('Error fetching slot data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [propertyId]);
  
  // Reset state when purchase is successful
  useEffect(() => {
    if (purchaseSuccess) {
      setPurchaseStep('success');
      // Refresh slot data after purchase
      setTimeout(() => {
        const fetchSlotsAfterPurchase = async () => {
          try {
            // Create an array of 100 slots
            const slotsPromises = Array.from({ length: 100 }, async (_, index) => {
              const id = index + 1;
              // Check if the slot is already owned
              const owner = await getSlotOwner(id);
              return { id, isSold: owner !== null };
            });
            
            const slotsData = await Promise.all(slotsPromises);
            setSlots(slotsData);
            setSelectedSlots([]);
          } catch (error) {
            console.error('Error fetching slot data:', error);
          }
        };
        
        fetchSlotsAfterPurchase();
      }, 2000);
    }
  }, [purchaseSuccess]);
  
  // Handle errors
  useEffect(() => {
    if (purchaseError) {
      setPurchaseStep('error');
    }
  }, [purchaseError]);

  const handleSlotClick = (slotId: number, isSold: boolean) => {
    if (isSold || purchaseStep !== 'select') return;
    
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        // If already selected, remove it
        return prev.filter(id => id !== slotId);
      } else {
        // If not selected, add it
        return [...prev, slotId];
      }
    });
  };

  const handlePurchase = async () => {
    if (selectedSlots.length === 0) return;
    
    // If not connected, we need to show a message
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    // Set to confirm step
    setPurchaseStep('confirm');
  };
  
  const confirmPurchase = async () => {
    if (selectedSlots.length === 0) return;
    
    try {
      setPurchaseStep('processing');
      await purchaseSlots(selectedSlots);
    } catch (error) {
      console.error('Error purchasing slots:', error);
      setPurchaseStep('error');
    }
  };
  
  const resetPurchase = () => {
    setPurchaseStep('select');
  };

  return (
    <>
      <Header title="Purchase Property Slots" />
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: '#4BD16F', 
                opacity: 0.7, 
                borderRadius: '50%' 
              }}></div>
              <span>Owned Slot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: 'white',
                border: '2px solid #4BD16F',
                borderRadius: '50%' 
              }}></div>
              <span>Available Slot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: '#FF9F00',
                borderRadius: '50%' 
              }}></div>
              <span>Selected Slot</span>
            </div>
          </div>
          {!isConnected && (
            <div style={{
              backgroundColor: '#FFF4E5',
              color: '#FF9F00',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              Please connect your wallet to purchase slots
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Property information */}
          <div style={{ 
            flex: '0 0 300px',
            backgroundColor: '#E8FFF0',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <Image 
              src="/Properties.png"
              alt="Property"
              width={260}
              height={260}
              style={{ 
                objectFit: 'cover', 
                borderRadius: '10px',
                marginBottom: '20px'
              }}
            />
            
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '15px' 
            }}>
              Property #{propertyId}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Slot Price:</span>
                <span style={{ fontWeight: 'bold' }}>100 USDT</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Total Slots:</span>
                <span style={{ fontWeight: 'bold' }}>100</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Available Slots:</span>
                <span style={{ fontWeight: 'bold' }}>{slots.filter(slot => !slot.isSold).length}</span>
              </div>
            </div>
            
            {/* Purchase steps */}
            {purchaseStep === 'select' && selectedSlots.length > 0 && (
              <div style={{ 
                backgroundColor: '#4BD16F', 
                color: 'white', 
                padding: '15px', 
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Selected Slots: {selectedSlots.length}</p>
                <p style={{ marginBottom: '5px' }}>Total Price: {selectedSlots.length * 100} USDT</p>
                <div style={{ 
                  maxHeight: '60px', 
                  overflowY: 'auto', 
                  fontSize: '0.85rem', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  padding: '5px', 
                  borderRadius: '5px'
                }}>
                  {selectedSlots.sort((a, b) => a - b).map(id => (
                    <span key={id} style={{ margin: '0 3px' }}>#{id}</span>
                  ))}
                </div>
              </div>
            )}
            
            {purchaseStep === 'confirm' && (
              <div style={{ 
                backgroundColor: '#FF9F00', 
                color: 'white', 
                padding: '15px', 
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Confirm Purchase</p>
                <p style={{ marginBottom: '5px' }}>You are about to purchase {selectedSlots.length} slots for {selectedSlots.length * 100} USDT.</p>
                <p style={{ fontSize: '0.8rem', marginBottom: '10px' }}>This action cannot be undone.</p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    style={{ 
                      backgroundColor: 'white', 
                      color: '#FF9F00', 
                      padding: '8px 15px', 
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      flex: 1
                    }}
                    onClick={resetPurchase}
                  >
                    Cancel
                  </button>
                  <button 
                    style={{ 
                      backgroundColor: '#4BD16F', 
                      color: 'white', 
                      padding: '8px 15px', 
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      flex: 1
                    }}
                    onClick={confirmPurchase}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
            
            {purchaseStep === 'processing' && (
              <div style={{ 
                backgroundColor: '#4BD16F', 
                color: 'white', 
                padding: '15px', 
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Processing Transaction</p>
                <p style={{ marginBottom: '15px' }}>Please wait while we process your purchase...</p>
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%', 
                  border: '3px solid rgba(255, 255, 255, 0.3)', 
                  borderTop: '3px solid white', 
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
            
            {purchaseStep === 'success' && (
              <div style={{ 
                backgroundColor: '#4BD16F', 
                color: 'white', 
                padding: '15px', 
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Purchase Successful!</p>
                <p style={{ marginBottom: '10px' }}>Your slots have been purchased successfully.</p>
                {txHash && (
                  <a 
                    href={`https://bscscan.com/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: 'white', 
                      textDecoration: 'underline',
                      display: 'block',
                      fontSize: '0.8rem',
                      marginBottom: '10px',
                      wordBreak: 'break-all'
                    }}
                  >
                    View transaction
                  </a>
                )}
                <button 
                  style={{ 
                    backgroundColor: 'white', 
                    color: '#4BD16F', 
                    padding: '8px 15px', 
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onClick={resetPurchase}
                >
                  Done
                </button>
              </div>
            )}
            
            {purchaseStep === 'error' && (
              <div style={{ 
                backgroundColor: '#FF3B30', 
                color: 'white', 
                padding: '15px', 
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Purchase Failed</p>
                <p style={{ marginBottom: '10px' }}>{purchaseError || 'An error occurred during the purchase.'}</p>
                <button 
                  style={{ 
                    backgroundColor: 'white', 
                    color: '#FF3B30', 
                    padding: '8px 15px', 
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onClick={resetPurchase}
                >
                  Try Again
                </button>
              </div>
            )}
            
            {purchaseStep === 'select' && (
              <button 
                style={{ 
                  backgroundColor: selectedSlots.length === 0 ? '#ccc' : '#4BD16F', 
                  color: 'white', 
                  width: '100%', 
                  padding: '12px 0', 
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: selectedSlots.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                  transition: 'background-color 0.2s ease',
                  boxShadow: '0 2px 4px rgba(75, 209, 111, 0.3)',
                  opacity: selectedSlots.length === 0 ? 0.7 : 1
                }}
                onClick={handlePurchase}
                disabled={selectedSlots.length === 0}
              >
                {selectedSlots.length === 0 ? 'Select Slots' : `Purchase ${selectedSlots.length} Slots`}
              </button>
            )}
          </div>
          
          {/* Slots grid */}
          <div style={{ 
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minHeight: '600px'
          }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%' 
              }}>
                <p>Loading slots...</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '15px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                {slots.map((slot) => {
                  const isSelected = selectedSlots.includes(slot.id);
                  
                  return (
                    <div 
                      key={slot.id}
                      onClick={() => handleSlotClick(slot.id, slot.isSold)}
                      style={{ 
                        width: '100%',
                        paddingBottom: '100%', // Make it a square
                        borderRadius: '50%',
                        backgroundColor: slot.isSold 
                          ? '#4BD16F' 
                          : isSelected 
                            ? '#FF9F00' 
                            : 'white',
                        opacity: slot.isSold ? 0.7 : 1,
                        border: (!slot.isSold && !isSelected) ? '2px solid #4BD16F' : 'none',
                        position: 'relative',
                        cursor: slot.isSold ? 'default' : 'pointer',
                        transition: 'transform 0.2s ease, background-color 0.2s ease',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isSelected ? '0 0 10px rgba(255, 159, 0, 0.5)' : 'none'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: slot.isSold 
                          ? 'white' 
                          : isSelected 
                            ? 'white' 
                            : '#4BD16F'
                      }}>
                        {slot.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 