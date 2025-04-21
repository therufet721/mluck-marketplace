'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {  getMarketplaceAvailableSlots } from '../../../../lib/slots';
import { useWalletStatus, usePurchaseSlots, useTokenBalance, useTokenApproval } from '../../../../lib/web3/hooks';
import { ADDRESSES } from '../../../../lib/contracts';
import { getProperty } from '../../../../lib/contracts';
import { getProvider } from '../../../../lib/slots';
import Header from '../../../../components/Header';
import { ethers } from 'ethers';

// Helper function for price calculations
const calculatePrice = (price: number) => {
  return price / Math.pow(10, 18);
};

// Helper function for price display
const formatPrice = (price: number) => {
  const formattedPrice = calculatePrice(price);
  return Number.isInteger(formattedPrice) ? formattedPrice.toString() : formattedPrice.toFixed(2);
};

// Helper function to format balance display
const formatBalanceDisplay = (balance: string) => {
  if (!balance) return '';
  const parts = balance.split(' ');
  const number = parseFloat(parts[0]);
  return `${Number.isInteger(number) ? number : number.toFixed(2)} ${parts[1]}`;
};

export default function PropertyPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const [slots, setSlots] = useState<Array<{ id: number; isSold: boolean }>>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseStep, setPurchaseStep] = useState<'select' | 'confirm' | 'processing' | 'success' | 'error'>('select');
  const [propertyDetails, setPropertyDetails] = useState<{
    price: number;
    fee: number;
    slotContract: string;
    status: number;
    name?: string;
  } | null>(null);
  
  // Get wallet connection status
  const { isConnected, address, isCorrectNetwork, switchNetwork } = useWalletStatus();
  
  // Get token balance
  const { balance, loading: balanceLoading, refetch: refetchBalance } = useTokenBalance();
  
  // Get purchase functionality
  const { 
    purchaseSlots, 
    loading: purchaseLoading, 
    success: purchaseSuccess, 
    error: purchaseError,
    txHash
  } = usePurchaseSlots();

  // Get token approval functionality
  const { approve, checkAllowance, loading: approvalLoading, error: approvalError } = useTokenApproval();
  const [needsApproval, setNeedsApproval] = useState(false);

  // Helper function to parse user balance
  const parseUserBalance = () => {
    if (!balance) return 0;
    const balanceParts = balance.split(' ');
    return parseFloat(balanceParts[0]);
  };

  // Helper function to calculate total cost
  const calculateTotalCost = (slotCount: number) => {
    if (!propertyDetails) return 0;
    return slotCount * (calculatePrice(propertyDetails.price) + calculatePrice(propertyDetails.fee));
  };

  // Add responsive state - improve with more breakpoints
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [isMobile, setIsMobile] = useState(false);

  // Add useEffect for improved responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setScreenSize('xs');
        setIsMobile(true);
      } else if (width < 768) {
        setScreenSize('sm');
        setIsMobile(true);
      } else if (width < 992) {
        setScreenSize('md');
        setIsMobile(false);
      } else if (width < 1200) {
        setScreenSize('lg');
        setIsMobile(false);
      } else {
        setScreenSize('xl');
        setIsMobile(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const availableSlots = await getMarketplaceAvailableSlots(propertyId);
        
        const TOTAL = 99;
        const slotsData = Array.from({ length: TOTAL }, (_, i) => ({ 
          id: i + 1, 
          isSold: !availableSlots.includes(i + 1) 
        }));
        
        setSlots(slotsData);
      } catch (error) {
        console.error('Error fetching slot data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchSlots();
    }
  }, [propertyId]);
  
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const provider = getProvider();
        console.log(provider);
        
        const details = await getProperty(provider as ethers.JsonRpcProvider, propertyId);
        setPropertyDetails({
          price: details.property.price,
          fee: details.property.fee,
          slotContract: details.property.slotContract,
          status: details.status,
          name: `Property #${propertyId}`
        });
      } catch (error) {
        console.error('Error fetching property details:', error);
      }
    };

    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);
  
  // Reset state when purchase is successful
  useEffect(() => {
    if (purchaseSuccess) {
      setPurchaseStep('success');
      // Refresh slot data after purchase
      setTimeout(() => {
        const fetchSlotsAfterPurchase = async () => {
          try {
            const availableSlots = await getMarketplaceAvailableSlots(propertyId);
            const TOTAL = 99;
            const slotsData = Array.from({ length: TOTAL }, (_, i) => ({ 
              id: i + 1, 
              isSold: !availableSlots.includes(i + 1) 
            }));
            setSlots(slotsData);
            setSelectedSlots([]);
          } catch (error) {
            console.error('Error fetching slot data:', error);
          }
        };
        
        fetchSlotsAfterPurchase();
      }, 2000);
    }
  }, [purchaseSuccess, propertyId]);
  
  // Handle errors
  useEffect(() => {
    if (purchaseError) {
      setPurchaseStep('error');
    }
  }, [purchaseError]);

  // Check if we need approval when slots are selected
  useEffect(() => {
    const checkApprovalNeeded = async () => {
      if (!isConnected || selectedSlots.length === 0 || !propertyDetails) return;
      
      const allowance = await checkAllowance(ADDRESSES.MARKETPLACE);
      // Calculate required amount considering 18 decimals
      const totalCost = selectedSlots.length * (calculatePrice(propertyDetails.price) + calculatePrice(propertyDetails.fee));
      // Add 10% buffer and format to user-friendly number
      const requiredAmount = totalCost * 1.1;
      setNeedsApproval(Number(allowance) < requiredAmount);
    };

    checkApprovalNeeded();
  }, [isConnected, selectedSlots, checkAllowance, propertyDetails]);

  // Add a useEffect to monitor balance changes
  useEffect(() => {
    if (isConnected) {
      // Initial balance check
      refetchBalance();
      
      // Set up polling for balance updates
      const interval = setInterval(refetchBalance, 5000); // Check every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isConnected, refetchBalance]);

  // Add useEffect to monitor selected slots and balance
  useEffect(() => {
    if (selectedSlots.length > 0 && balance && propertyDetails) {
      const totalCost = calculateTotalCost(selectedSlots.length);
      const currentBalance = parseUserBalance();
      
      if (currentBalance < totalCost) {
        console.log('Insufficient balance:', currentBalance, 'needed:', totalCost);
      } else {
        console.log('Sufficient balance:', currentBalance, 'needed:', totalCost);
      }
    }
  }, [selectedSlots, balance, propertyDetails]);

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
    
    // Check if on the correct network
    if (!isCorrectNetwork) {
      const switched = await switchNetwork();
      if (!switched) {
        alert('Please switch to Polygon network to continue');
        return;
      }
    }
    
    // Set to confirm step
    setPurchaseStep('confirm');
  };
  
  const confirmPurchase = async () => {
    if (selectedSlots.length === 0) return;
    
    try {
      setPurchaseStep('processing');
      await purchaseSlots(propertyId, selectedSlots);
    } catch (error) {
      console.error('Error purchasing slots:', error);
      setPurchaseStep('error');
    }
  };
  
  const resetPurchase = () => {
    setPurchaseStep('select');
  };

  const handleApprove = async () => {
    if (!isConnected || selectedSlots.length === 0 || !propertyDetails) return;
    
    try {
      setPurchaseStep('processing');
      // Calculate total cost with 10% buffer in actual token amount (not divided by 10^18)
      const totalCost = selectedSlots.length * (calculatePrice(propertyDetails.price) + calculatePrice(propertyDetails.fee));
      const requiredAmountWithBuffer = totalCost * 1.1;
      await approve(ADDRESSES.MARKETPLACE, requiredAmountWithBuffer);
      setNeedsApproval(false);
      
      // Automatically proceed with purchase after approval
      try {
        await purchaseSlots(propertyId, selectedSlots);
      } catch (error) {
        console.error('Error purchasing slots:', error);
        setPurchaseStep('error');
      }
    } catch (error) {
      console.error('Error approving tokens:', error);
      setPurchaseStep('error');
    }
  };

  // Update the button rendering logic
  const renderPurchaseButton = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!isCorrectNetwork) return 'Switch Network';
    if (selectedSlots.length === 0) return 'Select Slots';
    if (balanceLoading) return 'Checking Balance...';
    
    const totalCost = calculateTotalCost(selectedSlots.length);
    const currentBalance = parseUserBalance();
    
    if (currentBalance < totalCost) return 'Insufficient Balance';
    if (needsApproval) return 'Approve BUSD Spending';
    return `Purchase ${selectedSlots.length} Slots`;
  };

  // Update the button disabled state logic
  const isButtonDisabled = () => {
    if (!isConnected) return true;
    if (!isCorrectNetwork) return true;
    if (selectedSlots.length === 0) return true;
    if (balanceLoading) return true;
    
    const totalCost = calculateTotalCost(selectedSlots.length);
    const currentBalance = parseUserBalance();
    
    return currentBalance < totalCost;
  };

  // Helper function to shorten text based on screen size
  const shortenText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Get appropriate property name length based on screen size
  const getPropertyNameMaxLength = () => {
    switch (screenSize) {
      case 'xs': return 20;
      case 'sm': return 25;
      case 'md': return 35;
      default: return 50;
    }
  };

  // Get responsive padding and spacing values
  const getResponsiveStyles = () => {
    const styles = {
      containerPadding: '15px 15px',
      gridColumns: 'repeat(7, 1fr)',
      gridGap: '15px',
      fontSize: '1rem',
      sidebarWidth: '0 0 600px',
      imagePaddingRatio: '60%' // Reduced image height for desktop
    };

    switch (screenSize) {
      case 'xs':
        return {
          ...styles,
          containerPadding: '15px 10px',
          gridColumns: 'repeat(5, 1fr)',
          gridGap: '8px',
          fontSize: '0.8rem',
          sidebarWidth: '1',
          imagePaddingRatio: '75%' // Maintain aspect ratio for mobile
        };
      case 'sm':
        return {
          ...styles,
          containerPadding: '20px 15px',
          gridColumns: 'repeat(6, 1fr)',
          gridGap: '10px',
          fontSize: '0.9rem',
          sidebarWidth: '1',
          imagePaddingRatio: '75%' // Maintain aspect ratio for mobile
        };
      case 'md':
        return {
          ...styles,
          containerPadding: '30px 20px',
          gridColumns: 'repeat(8, 1fr)',
          gridGap: '12px',
          fontSize: '0.95rem',
          sidebarWidth: '0 0 350px',
          imagePaddingRatio: '65%' // Slightly reduced for tablet
        };
      default:
        return styles;
    }
  };

  const responsiveStyles = getResponsiveStyles();

  console.log(propertyDetails);
  
  return (
    <>
      <Header title="Purchase Property Slots" />
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: responsiveStyles.containerPadding,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '20px' : '40px',
          gap: isMobile ? '15px' : '0'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '15px' : '20px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: '#4BD16F', 
                opacity: 0.7, 
                borderRadius: '50%' 
              }}></div>
              <span style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Owned Slot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: 'white',
                border: '2px solid #4BD16F',
                borderRadius: '50%' 
              }}></div>
              <span style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Available Slot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '20px', 
                backgroundColor: '#FF9F00',
                borderRadius: '50%' 
              }}></div>
              <span style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Selected Slot</span>
            </div>
          </div>
          
          {/* Network warnings */}
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
          {isConnected && !isCorrectNetwork && (
            <div style={{
              backgroundColor: '#FFF4E5',
              color: '#FF9F00',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span>Please switch to Polygon network</span>
              <button 
                onClick={switchNetwork}
                style={{
                  backgroundColor: '#FF9F00',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Switch Network
              </button>
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '20px' : '30px', 
          maxWidth: '1200px'
        }}>
          {/* Property information */}
          <div style={{ 
            flex: responsiveStyles.sidebarWidth,
            backgroundColor: '#E8FFF0',
            borderRadius: '15px',
            padding: isMobile ? '15px' : '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            order: isMobile ? 2 : 1
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: responsiveStyles.imagePaddingRatio, // Use responsive ratio
              marginBottom: '20px',
              maxHeight: isMobile ? 'unset' : '300px', // Limit height on desktop
              overflow: 'hidden'
            }}>
              <Image 
                src="/Properties.png"
                alt="Property"
                fill
                style={{ 
                  objectFit: 'cover', 
                  borderRadius: '10px',
                }}
              />
            </div>
            
            <h2 style={{ 
              fontSize: screenSize === 'xs' ? '1.2rem' : screenSize === 'sm' ? '1.3rem' : '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '15px',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              {propertyDetails ? shortenText(propertyDetails.name || `Property #${propertyId}`, getPropertyNameMaxLength()) : `Property #${propertyId}`}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Price per Slot:</span>
                <span style={{ fontWeight: 'bold' }}>{propertyDetails ? formatPrice(propertyDetails.price) : '...'} BUSD</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Fee per Slot:</span>
                <span style={{ fontWeight: 'bold' }}>{propertyDetails ? formatPrice(propertyDetails.fee) : '...'} BUSD</span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Total Cost per Slot:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {propertyDetails ? (formatPrice(propertyDetails.price + propertyDetails.fee)) : '...'} BUSD
                </span>
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
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Network:</span>
                <span style={{ fontWeight: 'bold', color: '#FF9F00' }}>Polygon</span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Status:</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: propertyDetails?.status === 1 ? '#4BD16F' : '#FF9F00'
                }}>
                  {propertyDetails?.status === 1 ? 'Active' : propertyDetails?.status === 0 ? 'Inactive' : '...'}
                </span>
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
                <p style={{ marginBottom: '5px' }}>
                  Base Price: {propertyDetails ? formatPrice(propertyDetails.price * selectedSlots.length) : '0'} BUSD
                </p>
                <p style={{ marginBottom: '5px' }}>
                  Fees: {propertyDetails ? formatPrice(propertyDetails.fee * selectedSlots.length) : '0'} BUSD
                </p>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  Total Cost: {propertyDetails ? formatPrice((propertyDetails.price + propertyDetails.fee) * selectedSlots.length) : '0'} BUSD
                </p>
                {balance && (
                  <p style={{ 
                    fontSize: '0.9rem',
                    color: parseUserBalance() < calculateTotalCost(selectedSlots.length) ? '#FFE0E0' : 'white',
                    marginBottom: '10px'
                  }}>
                    Your Balance: {formatBalanceDisplay(balance)}
                    {parseUserBalance() < calculateTotalCost(selectedSlots.length) && (
                      <span style={{ display: 'block', marginTop: '5px', color: '#FFE0E0' }}>
                        Insufficient balance. Please add more BUSD to cover the purchase and fees.
                      </span>
                    )}
                  </p>
                )}
                {needsApproval && (
                  <p style={{ 
                    fontSize: '0.9rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '8px',
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                    Approval needed: The marketplace needs your permission to spend BUSD tokens.
                  </p>
                )}
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
                <p style={{ marginBottom: '5px' }}>
                  You are about to purchase {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} for a total of {propertyDetails ? formatPrice((propertyDetails.price + propertyDetails.fee) * selectedSlots.length) : '0'} BUSD
                  ({propertyDetails ? formatPrice(propertyDetails.price + propertyDetails.fee) : '0'} BUSD per slot).
                </p>
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
                    href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${txHash}`} 
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
                  backgroundColor: isButtonDisabled() ? '#ccc' : '#4BD16F', 
                  color: 'white', 
                  width: '100%', 
                  padding: '12px 0', 
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: isButtonDisabled() ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                  transition: 'background-color 0.2s ease',
                  boxShadow: '0 2px 4px rgba(75, 209, 111, 0.3)',
                  opacity: isButtonDisabled() ? 0.7 : 1
                }}
                onClick={needsApproval ? handleApprove : handlePurchase}
                disabled={isButtonDisabled()}
              >
                {renderPurchaseButton()}
              </button>
            )}
          </div>
          
          {/* Slots grid */}
          <div style={{ 
            flex: 1,
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: isMobile ? '15px' : '30px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minHeight: isMobile ? 'auto' : '600px',
            order: isMobile ? 1 : 2
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
                gridTemplateColumns: responsiveStyles.gridColumns,
                gap: responsiveStyles.gridGap,
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
                        paddingBottom: '100%',
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
                        fontSize: isMobile ? '1rem' : '0.75rem',
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

        {/* Fixed bottom bar for mobile */}
        {isMobile && purchaseStep === 'select' && selectedSlots.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            padding: screenSize === 'xs' ? '10px' : '15px',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 99
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''} Selected
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Total: {propertyDetails ? formatPrice((propertyDetails.price + propertyDetails.fee) * selectedSlots.length) : '0'} BUSD
                </div>
              </div>
              <button 
                style={{ 
                  backgroundColor: isButtonDisabled() ? '#ccc' : '#4BD16F', 
                  color: 'white', 
                  padding: '10px 20px', 
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: isButtonDisabled() ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.2s ease',
                  opacity: isButtonDisabled() ? 0.7 : 1
                }}
                onClick={needsApproval ? handleApprove : handlePurchase}
                disabled={isButtonDisabled()}
              >
                {renderPurchaseButton()}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 