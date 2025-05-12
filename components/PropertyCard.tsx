import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Property } from '../types';
import Link from 'next/link';

type PropertyCardProps = {
  isComingSoon?: boolean;
  property?: Property;
};

export default function PropertyCard({ isComingSoon = false, property }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Required minimum swipe distance
  const minSwipeDistance = 50;

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
    
    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const nextImage = useCallback(() => {
    if (!property?.gallery?.length || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentImageIndex((prevIndex) => {
      const nextIndex = prevIndex === property.gallery!.length - 1 ? 0 : prevIndex + 1;
      return nextIndex;
    });

    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [property?.gallery?.length, isAnimating]);

  const prevImage = useCallback(() => {
    if (!property?.gallery?.length || isAnimating) return;
    
    setIsAnimating(true);
    setCurrentImageIndex((prevIndex) => {
      const prevIndexValue = prevIndex === 0 ? property.gallery!.length - 1 : prevIndex - 1;
      return prevIndexValue;
    });

    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [property?.gallery?.length, isAnimating]);

  useEffect(() => {
    if (property?.gallery && property.gallery.length > 1) {
      const interval = setInterval(() => {
        nextImage();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [property?.gallery, nextImage]);

  const normalizeImageUrl = (url: string | undefined) => {
    if (!url) return '/Properties.png';
    return url;
  };

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

  const hasGallery = property.gallery && property.gallery.length > 0;

  return (
    <div style={{ 
      backgroundColor: '#E8FFF0', 
      borderRadius: '15px', 
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      position: 'relative',
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: '365px',
      padding: '26px'
    }}>
      {/* Property image section */}
      <div style={{ 
        position: 'relative', 
        marginBottom: '20px',
        width: '100%',
        height: '250px', // Explicit height
      }}>
        {hasGallery ? (
          <div 
            style={{
              position: 'relative',
              width: '100%',
              height: '0',
              paddingBottom: '75%',
              borderRadius: '15px',
              overflow: 'hidden',
            }}
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
              {property.gallery?.map((image, index) => (
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
                    src={normalizeImageUrl(image)}
                    alt={`${property.title} - Image ${index + 1}`}
                    fill
                    style={{
                      objectFit: 'cover',
                      borderRadius: '15px',
                    }}
                    priority={index === currentImageIndex}
                    unoptimized={true}
                    sizes="(max-width: 768px) 100vw, 400px"
                    onError={(e) => {
                      console.error('Image failed to load:', image);
                      (e.target as HTMLImageElement).src = '/Properties.png';
                    }}
                  />
                </div>
              ))}
            </div>

            {property.gallery && property.gallery.length > 1 && (
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
                    width: '30px',
                    height: '30px',
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    width: '30px',
                    height: '30px',
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
            
            {property.gallery && property.gallery.length > 1 && (
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
                {property.gallery.map((_, index) => (
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
            )}
          </div>
        ) : (
          <Image 
            src="/Properties.png"
            alt="Property"
            width={310}
            height={220}
            style={{ objectFit: 'cover', borderRadius: '15px' }}
          />
        )}
      </div>
      
      {/* Property details section */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ 
          fontSize: '1rem', 
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
            <span style={{ fontWeight: '600', color: '#333' }}>{Number(property.apy).toFixed(3)}%</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', color: '#4BD16F' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#4BD16F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Price per Slot:
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