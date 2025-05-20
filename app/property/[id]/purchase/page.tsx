'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {  getMarketplaceAvailableSlots } from '../../../../lib/slots';
import { useWalletStatus, usePurchaseSlots, useTokenBalance, useTokenApproval, usePurchaseSlotsWithPromo } from '../../../../lib/web3/hooks';
import { ADDRESSES, getPromoCode, getProperty, getCostUsingPromo } from '../../../../lib/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getProvider } from '../../../../lib/slots';
import Header from '../../../../components/Header';
import { ethers } from 'ethers';
import { useMobile } from '../../../../contexts/MobileContext';
import { useProperties } from '../../../../contexts/PropertiesContext';
import Pagination from '../../../../components/Pagination';
import Tooltip from '../../../components/Tooltip';
import { useAuth } from '../../../../contexts/AuthContext';
import { getPromocodeSignature } from '../../../../lib/api';

// Helper function for price calculations
const calculatePrice = (price: number) => {
  if (!price) return 0;
  // Convert from wei to USDT (6 decimals)
  return Number(price) / 1e6;
};

// Helper function for price display
const formatPrice = (price: number | BigInt) => {
  // Special case for direct USDT values (not wei)
  if (typeof price === 'number' && price < 1000 && price >= 0.01) {
    return price.toFixed(2);
  }
  
  // Convert to number if BigInt
  const priceAsNumber = typeof price === 'bigint' ? Number(price) / 1e6 : 
                       typeof price === 'number' ? calculatePrice(price) : 0;
  
  // Always show at least 2 decimal places for small numbers
  return priceAsNumber < 1 ? priceAsNumber.toFixed(2) : 
         Number.isInteger(priceAsNumber) ? priceAsNumber.toString() : 
         priceAsNumber.toFixed(2);
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
  const searchParams = useSearchParams();
  const propertyId = params.id as string;
  const { properties } = useProperties();
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
  
  const [totalSlots, setTotalSlots] = useState<number>(100); 
  // Add state for flipped slots
  const [flippedSlots, setFlippedSlots] = useState<Record<number, boolean>>({});
  
  // Add state for property images
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Get page from URL or default to 1
  const urlPage = searchParams.get('page');
  const urlPerPage = searchParams.get('perPage');
  
  // Pagination states with URL integration
  const [currentPage, setCurrentPage] = useState<number>(urlPage ? parseInt(urlPage) : 1);
  const [slotsPerPage, setSlotsPerPage] = useState<number>(urlPerPage ? parseInt(urlPerPage) : 100);

  // Use simplified wallet status hook
  const { isConnected, address: account } = useWalletStatus();
  
  // Get token balance with improved hook
  const { balance, loading: balanceLoading, refetch: refetchBalance } = useTokenBalance();
  
  // Get purchase functionality
  const { 
    purchaseSlots, 
    loading: purchaseLoading, 
    success: purchaseSuccess, 
    error: purchaseError,
    txHash
  } = usePurchaseSlots();

  // Get purchase with promocode functionality
  const {
    purchaseWithPromo,
    loading: promoLoading,
    success: promoSuccess,
    error: promoError,
    txHash: promoTxHash,
    reset: resetPromo
  } = usePurchaseSlotsWithPromo();

  // Get token approval functionality
  const { approve, checkAllowance, loading: approvalLoading, error: approvalError } = useTokenApproval();
  const [needsApproval, setNeedsApproval] = useState(false);

  // Use the shared mobile context
  const { isMobile } = useMobile();

  // Track touch positions for swipe functionality
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Required minimum swipe distance
  const minSwipeDistance = 50;

  // Add state for expanded image view
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // Add state for image animation
  const [isAnimating, setIsAnimating] = useState(false);

  // Add state for network switching
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  // Add promocode state
  const [promocode, setPromocode] = useState<string>('');
  const [promocodeValid, setPromocodeValid] = useState<boolean | null>(null);
  const [promocodeDiscount, setPromocodeDiscount] = useState<number>(0);
  const [promocodeLoading, setPromocodeLoading] = useState<boolean>(false);
  const [promocodeError, setPromocodeError] = useState<string | null>(null);
  const [promocodeSignature, setPromocodeSignature] = useState<string | null>(null);
  const [promocodeHash, setPromocodeHash] = useState<string | null>(null);
  const [discountedCost, setDiscountedCost] = useState<number | null>(null);

  // Add refs to track initial loads
  const isInitialMount = useRef(true);
  const isDataFetched = useRef(false);

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  // Handle touch end for swipe detection
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Navigate based on swipe direction
    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
    
    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Optimized next and prev image functions
  const nextImage = useCallback(() => {
    if (!propertyImages.length || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentImageIndex((prevIndex) => 
      prevIndex === propertyImages.length - 1 ? 0 : prevIndex + 1
    );
    
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [propertyImages.length, isAnimating]);
  
  const prevImage = useCallback(() => {
    if (!propertyImages.length || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? propertyImages.length - 1 : prevIndex - 1
    );
    
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [propertyImages.length, isAnimating]);

  // Autoplay functionality
  useEffect(() => {
    if (propertyImages.length > 1) {
      const interval = setInterval(() => {
        nextImage();
      }, 5000); // Change image every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [propertyImages.length, nextImage]);

  // Helper function to parse user balance
  const parseUserBalance = () => {
    if (!balance) return 0;
    const balanceParts = balance.split(' ');
    return parseFloat(balanceParts[0]);
  };

  // Helper function to calculate total cost
  const calculateTotalCost = (slotCount: number) => {
    if (!propertyDetails) return 0;
    const price = calculatePrice(propertyDetails.price);
    const fee = calculatePrice(propertyDetails.fee);
    return slotCount * (price + fee);
  };

  // Function to fetch property images
  const fetchPropertyImages = async (slotContract: string) => {
    if (!slotContract) return;
    
    setLoadingImages(true);
    try {
      // The API endpoint format based on the slot contract address
      const galleryUrl = `https://chain.mluck.io/${slotContract}/gallery/`;
      
      
      const response = await fetch(galleryUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
      }
      
      const imagesData = await response.json();
      
      // Validate the response data
      if (Array.isArray(imagesData) && imagesData.length > 0) {
        // Filter out any non-string items
        const validImages = imagesData.filter(url => {
          const isValid = typeof url === 'string';
          return isValid;
        });
        
        if (validImages.length > 0) {
          setPropertyImages(validImages);
          
          // Pre-check image loading to detect CORS issues
          validImages.forEach((url, index) => {
            const testImg = new window.Image();          // Add cache buster to avoid cached CORS errors
            testImg.src = `${url}?nocache=${Date.now()}`;
          });
        } else {
          setPropertyImages([]);
        }
      } else {
        setPropertyImages([]);
      }
    } catch (error) {
      console.error('Error fetching property images:', error);
      setPropertyImages([]);
    } finally {
      setLoadingImages(false);
    }
  };
  
  // Modify the property details fetch - only fetch on initial load/refresh
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!isDataFetched.current) {
        try {
          const provider = getProvider();
          const details = await getProperty(provider as ethers.JsonRpcProvider, propertyId);
          setPropertyDetails({
            price: details.property.price,
            fee: details.property.fee,
            slotContract: details.property.slotContract,
            status: details.status,
            name: `Property #${propertyId}`
          });

          await fetchPropertyImages(details.property.slotContract);

          // Get total supply from the slot contract
          const { getTotalSupply } = await import('../../../../lib/contracts');
          const totalSupply = await getTotalSupply(provider as ethers.JsonRpcProvider, details.property.slotContract);
          setTotalSlots(Number(totalSupply));
          
          isDataFetched.current = true;
        } catch (error) {
          console.error('Error fetching property details:', error);
        }
      }
    };

    if (propertyId) {
      fetchPropertyDetails();
    }
    
    // Add cleanup to reset on unmount
    return () => {
      isDataFetched.current = false;
    };
  }, [propertyId]);
  
  // Modify slots fetch to depend on totalSlots changes only
  useEffect(() => {
    const fetchSlots = async () => {
      if (totalSlots > 0) {
        setLoading(true);
        try {
          const availableSlots = await getMarketplaceAvailableSlots(propertyId);
          
          const slotsData = Array.from({ length: totalSlots }, (_, i) => ({ 
            id: i + 1, 
            isSold: !availableSlots.includes(i + 1) 
          }));
          
          setSlots(slotsData);
        } catch (error) {
          console.error('Error fetching slot data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSlots();
  }, [propertyId, totalSlots]);
  
  // Reset state when purchase is successful
  useEffect(() => {
    if (purchaseSuccess || promoSuccess) {
      setPurchaseStep('success');
      // Refresh slot data after purchase
      setTimeout(() => {
        const fetchSlotsAfterPurchase = async () => {
          try {
            const availableSlots = await getMarketplaceAvailableSlots(propertyId);
            const slotsData = Array.from({ length: totalSlots }, (_, i) => ({ 
              id: i + 1, 
              isSold: !availableSlots.includes(i + 1) 
            }));
            setSlots(slotsData);
            setSelectedSlots([]);
            setPromocode('');
            setPromocodeValid(null);
            setPromocodeDiscount(0);
            setPromocodeSignature(null);
            setPromocodeHash(null);
          } catch (error) {
            console.error('Error fetching slot data:', error);
          }
        };
        
        fetchSlotsAfterPurchase();
      }, 2000);
    }
  }, [purchaseSuccess, promoSuccess, propertyId, totalSlots]);
  
  // Handle errors
  useEffect(() => {
    if (purchaseError || promoError) {
      setPurchaseStep('error');
    }
  }, [purchaseError, promoError]);

  // Modify approval checking to only run when needed
  useEffect(() => {
    const checkApprovalNeeded = async () => {
      if (!isConnected || selectedSlots.length === 0 || !propertyDetails) return;
      
      // Only check allowance when slots are selected or changed
      const allowance = await checkAllowance(ADDRESSES.MARKETPLACE);
      const totalCost = selectedSlots.length * (calculatePrice(propertyDetails.price) + calculatePrice(propertyDetails.fee));
      const requiredAmount = totalCost * 1;
      setNeedsApproval(Number(allowance) < requiredAmount);
    };

    // Only check when selection changes
    if (selectedSlots.length > 0) {
      checkApprovalNeeded();
    }
  }, [isConnected, selectedSlots, checkAllowance, propertyDetails]);

  // Use auth context
  const { isAuthenticated: isConnectedAuth, isLoading: authLoading, isWrongNetwork, switchNetwork, isSwitchingNetwork } = useAuth();
  
  // Effect to synchronize wallet connection state and fetch balance immediately
  useEffect(() => {
    if (isConnected && isConnectedAuth) {
      console.log('PropertyPurchasePage: Wallet connected and authenticated, fetching balance');
      // Add a small delay to ensure wallet is fully initialized
      setTimeout(() => {
        refetchBalance();
      }, 15000);
    }
  }, [isConnected, isConnectedAuth, refetchBalance]);

  // Effect to update balance when promocode validation changes
  useEffect(() => {
    if (isConnected && isConnectedAuth && promocodeValid !== null) {
      console.log('PropertyPurchasePage: Promocode validation changed, updating balance');
      refetchBalance();
    }
  }, [isConnected, isConnectedAuth, promocodeValid, refetchBalance]);

  // Effect to update balance after purchase steps
  useEffect(() => {
    if (isConnected && isConnectedAuth && (purchaseStep === 'success' || purchaseStep === 'error')) {
      console.log('PropertyPurchasePage: Purchase step changed, updating balance');
      refetchBalance();
    }
  }, [isConnected, isConnectedAuth, purchaseStep, refetchBalance]);

  // Add this effect to update from URL
  useEffect(() => {
    if (urlPage) {
      const page = parseInt(urlPage);
      if (page > 0 && page <= getTotalPages()) {
        setCurrentPage(page);
      }
    }
    
    if (urlPerPage) {
      const perPage = parseInt(urlPerPage);
      if ([25, 50, 100, 200].includes(perPage)) {
        setSlotsPerPage(perPage);
      }
    }
  }, [urlPage, urlPerPage]);

  const handleSlotClick = (slotId: number, isSold: boolean) => {
    if (isSold || purchaseStep !== 'select') return;
    
    // Update selected slots
    setSelectedSlots(prev => {
      const newSelectedSlots = prev.includes(slotId)
        ? prev.filter(id => id !== slotId) // Remove if already selected
        : [...prev, slotId]; // Add if not selected
      
      // Update flipped state based on selection
      setFlippedSlots(currentFlipped => {
        const newFlipped = { ...currentFlipped };
        
        // For the slot being clicked, set flip state based on selection
        // If being selected, flip it. If being deselected, unflip it.
        newFlipped[slotId] = !prev.includes(slotId);
        
        return newFlipped;
      });
      
      return newSelectedSlots;
    });
  };
  
  // Remove the separate flip handler since flipping is now automatic with selection
  const handleFlipClick = (slotId: number, e: React.MouseEvent) => {
    // This function is no longer needed, but keeping the stub
    // in case we want to add special flip behavior later
    e.stopPropagation();
  };

  // Helper function to calculate discounted price
  const calculateDiscountedTotalCost = useCallback((slotCount: number) => {
    if (!propertyDetails) return 0;
    
    // If we have a contract-calculated discounted cost, use that
    if (discountedCost !== null && promocodeValid && promocodeHash) {
      return discountedCost;
    }
    
    // If no discount value available, return the regular price
    return calculateTotalCost(slotCount);
  }, [propertyDetails, promocodeValid, promocodeHash, discountedCost, calculateTotalCost]);

  // Function to fetch discounted cost from contract
  const fetchDiscountedCost = useCallback(async () => {
    if (!propertyId || !selectedSlots.length || !promocodeHash || !promocodeValid) {
      setDiscountedCost(null);
      return;
    }

    try {
      setPromocodeLoading(true);
      const provider = getProvider();
      // Use the imported function directly to get cost from the blockchain
      const cost = await getCostUsingPromo(
        provider as ethers.JsonRpcProvider,
        propertyId,
        selectedSlots.length,
        promocodeHash
      );
      // Convert from wei to USDT (6 decimals for USDT)
      const costInUsdt = Number(cost) / 1e6;
      setDiscountedCost(costInUsdt);
      setPromocodeLoading(false);
      return costInUsdt;
    } catch (error) {
      console.error('Error fetching discounted cost:', error);
      setDiscountedCost(null);
      setPromocodeLoading(false);
      return null;
    }
  }, [propertyId, selectedSlots.length, promocodeHash, promocodeValid]);

  // Update useEffect to call fetchDiscountedCost when promocode changes
  useEffect(() => {
    if (promocodeValid && promocodeHash) {
      fetchDiscountedCost();
    } else {
      setDiscountedCost(null);
    }
  }, [promocodeValid, promocodeHash, selectedSlots.length, fetchDiscountedCost]);

  // Add this effect to immediately recalculate when selection changes with valid promocode
useEffect(() => {
  if (promocodeValid && promocodeHash && selectedSlots.length > 0) {
    // Force recalculation when slot selection changes with valid promocode
    fetchDiscountedCost();
  }
}, [selectedSlots, promocodeValid, promocodeHash, fetchDiscountedCost]);

  // Function to validate promocode
const validatePromocode = useCallback(async () => {
  if (!promocode || !account) {
    setPromocodeValid(null);
    setPromocodeDiscount(0);
    setPromocodeSignature(null);
    setPromocodeHash(null);
    setDiscountedCost(null);
    return;
  }

  try {
    setPromocodeLoading(true);
    setPromocodeError(null);

    // Call the API to get the signature
    const promoData = await getPromocodeSignature(account, promocode);
    
    // Check if we have the required fields in the response
    if (!promoData.signature || !promoData.promoHash) {
      throw new Error('Missing required promocode data');
    }

    // Store the signature and hash for later use
    setPromocodeSignature(promoData.signature);
    setPromocodeHash(promoData.promoHash);
    
    // Get the actual promocode details from the blockchain
    const provider = getProvider();
    const promocodeDetails = await getPromoCode(provider as ethers.JsonRpcProvider, promoData.promoHash);
    
    // Set the discount percentage from blockchain data (already in decimal form)
    const discountPercent = Number(promocodeDetails.percent) / 10000;
    
    if (discountPercent <= 0 || discountPercent > 1) {
      throw new Error('Invalid discount percentage. Must be between 0 and 100%.');
    }
    
    setPromocodeValid(true);
    setPromocodeDiscount(discountPercent);
    
    // Fetch the discounted cost from the contract is handled separately
    // to avoid nested loading states
  } catch (error: any) {
    console.error('Promocode validation error:', error);
    setPromocodeValid(false);
    setPromocodeError(error.message || 'Invalid promocode');
    setPromocodeDiscount(0);
    setPromocodeSignature(null);
    setPromocodeHash(null);
    setDiscountedCost(null);
  } finally {
    setPromocodeLoading(false);
  }
}, [promocode, account]);

  // Modify promo code validation to be more efficient
  useEffect(() => {
    // Add debounce to avoid too many API calls while typing
    const timer = setTimeout(() => {
      if (promocode && promocode.length > 0) {
        validatePromocode();
      } else {
        setPromocodeValid(null);
        setPromocodeDiscount(0);
        setPromocodeSignature(null);
        setPromocodeHash(null);
      }
    }, 500); // Wait 500ms after typing stops
    
    return () => clearTimeout(timer);
  }, [promocode, validatePromocode]);

  // Update button rendering logic
  const renderPurchaseButton = () => {
    if (authLoading) return 'Connecting...';
    if (!isConnectedAuth) return renderConnectButton();
    if (isWrongNetwork && isSwitchingNetwork) return 'Switching Network...';
    if (selectedSlots.length === 0) return 'Select Slots';
    if (balanceLoading) return 'Checking...';
    
    const totalCost = promocodeValid ? 
      calculateDiscountedTotalCost(selectedSlots.length) : 
      calculateTotalCost(selectedSlots.length);
    const currentBalance = parseUserBalance();
    
    if (currentBalance < totalCost) return 'Insufficient Balance';
    if (needsApproval) return 'Approve USDT Spending';
    
    const prefix = promocodeValid ? 'Purchase with Promocode' : 'Purchase';
    return `${prefix} (${selectedSlots.length} Slots)`;
  };

  // Update button disabled state logic
  const isButtonDisabled = () => {
    if (authLoading) return true;
    if (!isConnectedAuth) return false;
    if (isWrongNetwork && isSwitchingNetwork) return true;
    if (selectedSlots.length === 0) return true;
    if (balanceLoading || promocodeLoading) return true;
    
    const totalCost = promocodeValid ? 
      calculateDiscountedTotalCost(selectedSlots.length) : 
      calculateTotalCost(selectedSlots.length);
    const currentBalance = parseUserBalance();
    
    return currentBalance < totalCost;
  };

  // Update button click handler
  const handleButtonClick = async () => {
    if (!isConnectedAuth) {
      // Handle by ConnectWallet component
      return;
    }
    
    if (isWrongNetwork && isSwitchingNetwork) {
      await switchNetwork?.();
      return;
    }
    
    if (selectedSlots.length === 0) return;
    
    if (needsApproval) {
      await handleApprove();
    } else {
      await handlePurchase();
    }
  };

  // Helper function to shorten text based on screen size
  const shortenText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Get appropriate property name length based on screen size
  const getPropertyNameMaxLength = () => {
    return isMobile ? 25 : 50;
  };

  // Helper function to get responsive padding and spacing values
  const getResponsiveStyles = () => {
    if (isMobile) {
      return {
        containerPadding: '15px 10px',
        gridColumns: 'repeat(10, 1fr)',
        gridGap: '12px',
        fontSize: '0.9rem',
        sidebarWidth: '100%',
        imagePaddingRatio: '50%',
        slotFontSize: '1rem',
        propertyMaxWidth: '100%',
      };
    } else {
      return {
        containerPadding: '30px',
        gridColumns: 'repeat(10, 1fr)',
        gridGap: '16px',
        fontSize: '1rem',
        sidebarWidth: '50%',
        imagePaddingRatio: '40%',
        slotFontSize: '0.9rem',
        propertyMaxWidth: '50%',
      };
    }
  };

  // Get paginated slots
  const getPaginatedSlots = () => {
    const startIndex = (currentPage - 1) * slotsPerPage;
    const endIndex = Math.min(startIndex + slotsPerPage, slots.length);
    return slots.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = () => {
    return Math.ceil(slots.length / slotsPerPage);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > getTotalPages()) return;
    setCurrentPage(page);
  };
  
  // Handle per page change
  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const perPage = parseInt(e.target.value);
    setSlotsPerPage(perPage);
    
    // Update URL with new per page value
    const params = new URLSearchParams(searchParams.toString());
    params.set('perPage', perPage.toString());
    params.set('page', '1'); // Reset to page 1 when changing items per page
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    
    // Reset to page 1
    setCurrentPage(1);
  };

  const responsiveStyles = getResponsiveStyles();

  // Function to preload images - disabled to avoid CORS issues
  const preloadImages = useCallback((imageUrls: string[]) => {
    // Don't attempt client-side preloading as it causes CORS errors
    // No actual preloading - Next.js Image with priority will handle this
  }, []);

  // Update the useEffect to preload images when property images are set
  useEffect(() => {
    if (propertyImages.length > 0) {
      preloadImages(propertyImages);
    }
  }, [propertyImages, preloadImages]);

  // Add keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation when the carousel is visible
      if (propertyImages.length > 0) {
        if (e.key === 'ArrowLeft') {
          prevImage();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [propertyImages.length, prevImage, nextImage]);

  // Function to toggle expanded image view
  const toggleExpandedView = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  // No longer needed - removed debug logging for image changes

  // Function to get property name
  const getPropertyName = useCallback(() => {
    if (!propertyDetails || !properties) return `Property #${propertyId}`;
    
    // Find matching property in context
    const contextProperty = properties.find(p => p.address.toLowerCase() === propertyDetails.slotContract.toLowerCase());
    
    // Use context name if found, otherwise use default
    return contextProperty ? contextProperty.title : (propertyDetails.name || `Property #${propertyId}`);
  }, [propertyDetails, properties, propertyId]);

  // Add missing functions
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
      
      // If promocode is valid and we have a signature, use it
      if (promocodeValid && promocodeSignature && promocodeHash) {
        // Pass all 4 parameters: property address, slots, promoHash, signature
        await purchaseWithPromo(propertyId, selectedSlots, promocodeHash, promocodeSignature);
      } else {
        await purchaseSlots(propertyId, selectedSlots);
      }
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
      // Calculate total cost in wei, then convert to USDT for approval
      const baseTotalInWei = BigInt(selectedSlots.length) * BigInt(propertyDetails.price + propertyDetails.fee);
      
      // If we have a promocode, apply the discount
      let totalCostInWei = baseTotalInWei;
      if (promocodeValid && promocodeDiscount > 0 && promocodeDiscount <= 1) {
        const discountPercent = Math.floor(promocodeDiscount * 100);
        const remainingPercent = 100 - discountPercent;
        const remainingFactor = remainingPercent / 100;
        totalCostInWei = baseTotalInWei * BigInt(Math.floor(remainingFactor * 10000)) / BigInt(10000);
      }
      
      // Convert to USDT and add 10% buffer
      const totalCost = Number(totalCostInWei) / 1e6;
      const requiredAmountWithBuffer = totalCost * 1;
      
      await approve(ADDRESSES.MARKETPLACE, requiredAmountWithBuffer);
      setNeedsApproval(false);
      
      // Automatically proceed with purchase after approval
      // No need to set purchase step to 'confirm' here, directly purchase
      setPurchaseStep('processing'); // Ensure processing step is set before async operations
      try {
        if (promocodeValid && promocodeSignature && promocodeHash) {
          // Pass all 4 parameters: property address, slots, promoHash, signature
          await purchaseWithPromo(propertyId, selectedSlots, promocodeHash, promocodeSignature);
        } else {
          await purchaseSlots(propertyId, selectedSlots);
        }
      } catch (error) {
        console.error('Error purchasing slots:', error);
        setPurchaseStep('error');
      }
    } catch (error) {
      console.error('Error approving tokens:', error);
      setPurchaseStep('error');
    }
  };

  // Add effect to handle wallet connection button click
  const handleWalletConnect = useCallback(() => {
    console.log('PropertyPurchasePage: Wallet connect button clicked');
    // Add a small delay to ensure wallet is fully initialized
    setTimeout(() => {
      if (isConnected && isConnectedAuth) {
        refetchBalance();
      }
    }, 500);
  }, [isConnected, isConnectedAuth, refetchBalance]);

  // Update the ConnectButton.Custom render prop
  const renderConnectButton = () => (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const ready = mounted;
        return (
          <div 
            onClick={() => {
              openConnectModal();
              handleWalletConnect();
            }} 
            style={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: ready ? 1 : 0.5
            }}
          >
            Connect Wallet
          </div>
        );
      }}
    </ConnectButton.Custom>
  );

  return (
    <>
      <Header title="Purchase Property Slots" />
      {/* Expanded Image Modal */}
      {isImageExpanded && propertyImages.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={toggleExpandedView}
        >
          <div 
            style={{
              position: 'relative',
              width: '90%',
              height: '100vh', // Explicit height
              maxWidth: '1200px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image 
              src={propertyImages[currentImageIndex]} 
              alt={`Property Image ${currentImageIndex + 1}`}
              fill
              style={{ 
                objectFit: 'contain',
              }}
              sizes="90vw"
              unoptimized={true}
              priority
              onError={(e) => {
                console.error('Expanded image failed to load:', propertyImages[currentImageIndex]);
                // Use default image as fallback
                (e.target as HTMLImageElement).src = '/Properties.png';
              }}
            />
            
            {/* Close button */}
            <button
              onClick={toggleExpandedView}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              aria-label="Close expanded view"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {/* Navigation buttons */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              transform: 'translateY(-50%)',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 20px',
            }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAnimating) prevImage();
                }}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: isAnimating ? 'default' : 'pointer'
                }}
                aria-label="Previous image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAnimating) nextImage();
                }}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: isAnimating ? 'default' : 'pointer'
                }}
                aria-label="Next image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            
            {/* Image counter */}
            <div style={{
              position: 'absolute',
              bottom: '15px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: '5px 15px',
              borderRadius: '20px',
              fontSize: '14px'
            }}>
              {currentImageIndex + 1} / {propertyImages.length}
            </div>
          </div>
        </div>
      )}
      
      <div style={{ 
        maxWidth: '1400px', // Increased max-width
        margin: '0 auto', 
        padding: responsiveStyles.containerPadding,
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}>
        {/* Legend section */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px',
                position: 'relative',
                backgroundImage: `url('/images/BAK-KR1.svg')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}>
                {/* Sold Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '5%',
                  right: '5%',
                  width: '30%',
                  height: '30%',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></div>
              </div>
              <span style={{ fontSize: responsiveStyles.fontSize }}>Owned Slot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px',
                position: 'relative',
                backgroundImage: `url('/images/BAK-KR1.svg')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}>
                {/* Available Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '5%',
                  right: '5%',
                  width: '30%',
                  height: '30%',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></div>
              </div>
              <span style={{ fontSize: responsiveStyles.fontSize }}>Available Slot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px',
                position: 'relative',
                backgroundImage: `url('/images/BAK-KR1.svg')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}>
                {/* Selected Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '5%',
                  right: '5%',
                  width: '30%',
                  height: '30%',
                  borderRadius: '50%',
                  backgroundColor: '#FF9F00',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}></div>
              </div>
              <span style={{ fontSize: responsiveStyles.fontSize }}>Selected Slot</span>
            </div>
          </div>
          
          {/* Network warnings - updated to show switching state */}
          {isWrongNetwork && (
            <div style={{
              backgroundColor: '#FFF4E5',
              color: '#FF9F00',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {isSwitchingNetwork ? (
                <>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    border: '2px solid #FF9F00', 
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Switching to Polygon network...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9F00" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Please switch to Polygon network to continue
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '30px',
          width: '100%'
        }}>
          {/* Property information */}
          <div style={{ 
            width: isMobile ? '100%' : '50%',
            backgroundColor: '#E8FFF0',
            borderRadius: '15px',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            order: isMobile ? 2 : 1,
            alignSelf: 'flex-start',
            minWidth: isMobile ? 'auto' : '50%'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              margin: '0 auto',
              paddingBottom: responsiveStyles.imagePaddingRatio,
              marginBottom: '20px',
              maxHeight: isMobile ? '300px' : '400px',
              height: isMobile ? '250px' : '350px',
              overflow: 'hidden',
              borderRadius: '10px'
            }}>
              {/* Image Carousel */}
              {propertyImages.length > 0 ? (
                <div 
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '0',
                    paddingBottom: '75%',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                  onClick={toggleExpandedView}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    transition: 'transform 300ms ease-out',
                    transform: `translateX(-${currentImageIndex * 100}%)`
                  }}>
                    {propertyImages.map((image, index) => (
                      <div
                        key={index}
                        style={{
                          flex: '0 0 100%',
                          position: 'relative',
                          width: '100%',
                          height: '100%'
                        }}
                      >
                        <Image 
                          src={image}
                          alt={`Property Image ${index + 1}`}
                          fill
                          style={{ 
                            objectFit: 'cover',
                            borderRadius: '10px',
                          }}
                          unoptimized={true}
                          priority={index === currentImageIndex}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          onError={(e) => {
                            console.error('Image failed to load:', image);
                            (e.target as HTMLImageElement).src = '/Properties.png';
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 10px',
                    zIndex: 5
                  }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAnimating) prevImage();
                      }}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: isAnimating ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        opacity: isAnimating ? 0.5 : 1,
                        transform: `scale(${isAnimating ? 0.95 : 1})`
                      }}
                      disabled={isAnimating}
                      aria-label="Previous image"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAnimating) nextImage();
                      }}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: isAnimating ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        opacity: isAnimating ? 0.5 : 1,
                        transform: `scale(${isAnimating ? 0.95 : 1})`
                      }}
                      disabled={isAnimating}
                      aria-label="Next image"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Image Indicators */}
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '0',
                    right: '0',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    zIndex: 5
                  }}>
                    {propertyImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAnimating) {
                            setIsAnimating(true);
                            setCurrentImageIndex(index);
                            setTimeout(() => setIsAnimating(false), 300);
                          }
                        }}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                          border: 'none',
                          padding: 0,
                          cursor: isAnimating ? 'default' : 'pointer',
                          transition: 'all 0.3s ease',
                          transform: `scale(${index === currentImageIndex ? 1.2 : 1})`,
                          opacity: isAnimating ? 0.5 : 1
                        }}
                        disabled={isAnimating}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : loadingImages ? (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '10px',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    border: '4px solid rgba(75, 209, 111, 0.3)', 
                    borderTop: '4px solid #4BD16F', 
                    animation: 'spin 1s linear infinite',
                  }}></div>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>Loading property images...</p>
                </div>
              ) : (
                <Image 
                  src="/Properties.png"
                  alt="Property"
                  fill
                  style={{ 
                    objectFit: 'cover', 
                    borderRadius: '10px',
                  }}
                />
              )}
            </div>
            
            <h2 style={{ 
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: 'bold', 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '15px',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              {propertyDetails ? shortenText(getPropertyName(), getPropertyNameMaxLength()) : `Property #${propertyId}`}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Price per Slot:</span>
                <span style={{ fontWeight: 'bold' }}>{propertyDetails ? formatPrice(propertyDetails.price) : '...'} USDT</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Fee per Slot:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {propertyDetails ? 
                      (propertyDetails.fee === 0 ? 
                        <span style={{ textDecoration: 'line-through' }}>10 USDT</span> : 
                        `${formatPrice(propertyDetails.fee)} USDT`) 
                      : '...'}
                  </span>
                  {propertyDetails?.fee === 0 && (
                    <Tooltip 
                      content="Limited time promotion! Regular fee is 10 USDT per slot. This promotional rate is available for a limited time only."
                      placement="top"
                    >
                      <div>
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ color: '#4BD16F', cursor: 'help' }}
                        >
                          <path 
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                          <path 
                            d="M12 16V12" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                          <path 
                            d="M12 8H12.01" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Total Cost per Slot:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {propertyDetails ? (formatPrice(propertyDetails.price + propertyDetails.fee)) : '...'} USDT
                </span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px' 
              }}>
                <span>Total Slots:</span>
                <span style={{ fontWeight: 'bold' }}>{totalSlots}</span>
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
                  Base Price: {propertyDetails ? formatPrice(propertyDetails.price * selectedSlots.length) : '0'} USDT
                </p>
                <p style={{ marginBottom: '5px' }}>
                  Fees: {propertyDetails ? formatPrice(propertyDetails.fee * selectedSlots.length) : '0'} USDT
                </p>
                
                {/* Promocode input */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '5px'
                  }}>
                    <input
                      type="text"
                      value={promocode}
                      onChange={(e) => setPromocode(e.target.value)}
                      placeholder="Enter promocode (optional)"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        borderRadius: '5px',
                        color: 'black',
                        border: 'none',
                        fontSize: '0.9rem'
                      }}
                    />
                    {promocodeLoading && (
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        border: '2px solid rgba(255, 255, 255, 0.3)', 
                        borderTop: '2px solid white', 
                        animation: 'spin 1s linear infinite',
                      }}></div>
                    )}
                  </div>
                  
                  {promocodeValid === true && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '5px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Promocode applied! {Math.floor(promocodeDiscount * 100)}% discount
                    </div>
                  )}
                  
                  {promocodeValid === false && (
                    <div style={{
                      backgroundColor: 'rgba(255, 0, 0, 0.2)',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '5px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      This promoCode is not valid
                    </div>
                  )}
                </div>
                
                {/* Show discounted price if promocode is valid */}
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  Total Cost: 
                  {propertyDetails ? (
                    promocodeValid ? (
                      <>
                        <span style={{ 
                          textDecoration: 'line-through', 
                          marginLeft: '5px',
                          marginRight: '5px',
                          opacity: 0.7,
                          fontSize: '0.9rem'
                        }}>
                          {formatPrice((propertyDetails.price + propertyDetails.fee) * selectedSlots.length)}
                        </span>
                        {formatPrice(calculateDiscountedTotalCost(selectedSlots.length))} ({Math.floor(promocodeDiscount * 100)}% off)
                      </>
                    ) : (
                      ` ${formatPrice((propertyDetails.price + propertyDetails.fee) * selectedSlots.length)}`
                    )
                  ) : '0'} USDT
                </p>
                
                {balance && (
                  <p style={{ 
                    fontSize: '0.9rem',
                    color: parseUserBalance() < (promocodeValid ? 
                      calculateDiscountedTotalCost(selectedSlots.length) : 
                      calculateTotalCost(selectedSlots.length)) 
                      ? '#FFE0E0' : 'white',
                    marginBottom: '10px'
                  }}>
                    Your Balance: {formatBalanceDisplay(balance)}
                    {parseUserBalance() < (promocodeValid ? 
                      calculateDiscountedTotalCost(selectedSlots.length) : 
                      calculateTotalCost(selectedSlots.length)) && (
                      <span style={{ display: 'block', marginTop: '5px', color: '#FFE0E0' }}>
                        Insufficient balance. Please add more USDT to cover the purchase and fees.
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
                    Approval needed: The marketplace needs your permission to spend USDT tokens.
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
                  You are about to purchase {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} for a total of {
                    propertyDetails ? (
                      promocodeValid ? 
                        `${formatPrice(calculateDiscountedTotalCost(selectedSlots.length))} (${Math.floor(promocodeDiscount * 100)}% off)` : 
                        formatPrice((propertyDetails.price + propertyDetails.fee) * selectedSlots.length)
                    ) : '0'
                  } USDT
                  ({propertyDetails ? formatPrice(propertyDetails.price + propertyDetails.fee) : '0'} USDT per slot).
                </p>
                
                {promocodeValid && (
                  <p style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    padding: '8px', 
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    marginBottom: '10px'
                  }}>
                    <strong>Promocode:</strong> {promocode} ({Math.floor(promocodeDiscount * 100)}% discount applied)
                  </p>
                )}
                
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
                {(txHash || promoTxHash) && (
                  <a 
                    href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${txHash || promoTxHash}`} 
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
                <p style={{ marginBottom: '10px' }}>{purchaseError || promoError || 'An error occurred during the purchase.'}</p>
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
                onClick={handleButtonClick}
                disabled={isButtonDisabled()}
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
                  opacity: isButtonDisabled() ? 0.7 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {!isConnectedAuth ? (
                  renderConnectButton()
                ) : (
                  renderPurchaseButton()
                )}
              </button>
            )}
          </div>
          
          {/* Slots grid */}
          <div style={{ 
            width: isMobile ? '100%' : '50%',
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            order: isMobile ? 1 : 2,
            minWidth: isMobile ? 'auto' : '50%'
          }}>
            {/* Pagination controls and Items per page - top */}
            {totalSlots > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '20px'
              }}>
                
                {totalSlots > slotsPerPage && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={getTotalPages()}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
            
            {loading ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                height: '300px',
                gap: '20px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  border: '4px solid rgba(75, 209, 111, 0.3)', 
                  borderTop: '4px solid #4BD16F', 
                  animation: 'spin 1s linear infinite',
                }}></div>
                <p style={{ fontSize: '1rem', color: '#333' }}>Loading available slots...</p>
                <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Please wait while we retrieve the latest availability information</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: responsiveStyles.gridColumns,
                gap: responsiveStyles.gridGap,
                width: '100%',
                margin: '0 auto'
              }}>
                {getPaginatedSlots().map((slot) => {
                  const isSelected = selectedSlots.includes(slot.id);
                  const isFlipped = flippedSlots[slot.id] || false;
                  
                  return (
                    <div 
                      key={slot.id}
                      onClick={() => handleSlotClick(slot.id, slot.isSold)}
                      style={{ 
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '100%',
                        cursor: slot.isSold ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected ? '0 0 10px rgba(255, 159, 0, 0.3)' : 'none',
                        maxWidth: 'none', 
                        margin: '0 auto',
                        perspective: '1000px'
                      }}
                    >
                      {/* Flip container with SVG Background */}
                      <div 
                        className="flip-container"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.6s',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        {/* Front side - SVG */}
                        <div 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backfaceVisibility: 'hidden',
                            backgroundImage: `url('/images/BAK-KR1.svg')`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        
                        {/* Back side - ID Number */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            backgroundImage: `url('/images/BAK-KR1.svg')`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: 'transparent',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'black',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                          >
                            {slot.id}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '5%',
                          right: '5%',
                          width: '30%',
                          height: '30%',
                          borderRadius: '50%',
                          backgroundColor: slot.isSold 
                            ? '#EF4444' // Red for sold
                            : isSelected 
                              ? '#FF9F00' // Orange for selected
                              : '#10B981', // Green for available
                          border: '2px solid white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          zIndex: 4
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Pagination controls - bottom */}
            {totalSlots > slotsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={getTotalPages()}
                onPageChange={handlePageChange}
                containerStyles={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}
              />
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
            padding: '15px',
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
                  Total: {propertyDetails ? (
                    promocodeValid ? (
                      <>
                        <span style={{ textDecoration: 'line-through', marginRight: '5px', opacity: 0.7 }}>
                          {formatPrice((propertyDetails.price + propertyDetails.fee) * selectedSlots.length)}
                        </span>
                        {formatPrice(calculateDiscountedTotalCost(selectedSlots.length))}
                      </>
                    ) : (
                      formatPrice((propertyDetails.price + propertyDetails.fee) * selectedSlots.length)
                    )
                  ) : '0'} USDT
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
                  opacity: isButtonDisabled() ? 0.7 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minWidth: '120px'
                }}
                onClick={handleButtonClick}
                disabled={isButtonDisabled()}
              >
                {!isConnectedAuth ? (
                  renderConnectButton()
                ) : (
                  renderPurchaseButton()
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}