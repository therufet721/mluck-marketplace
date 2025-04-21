'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type MobileContextType = {
  isMobile: boolean;
};

const MobileContext = createContext<MobileContextType>({ isMobile: false });

export const useMobile = () => useContext(MobileContext);

export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
} 