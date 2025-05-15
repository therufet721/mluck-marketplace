'use client';

import { Inter } from 'next/font/google';
import "./globals.css";
import { PropertiesProvider } from '../contexts/PropertiesContext';
import { MobileProvider } from '../contexts/MobileContext';
import { AuthProvider } from '../contexts/AuthContext';
import ClientWeb3Provider from "../components/providers/ClientWeb3Provider";
import ForceNetworkSwitch from '../components/ForceNetworkSwitch';
import NetworkChangeHandler from '../components/NetworkChangeHandler';
import { useEffect, useState } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Simple error boundary to catch rendering errors
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // Add error event listener to window
    const handleError = (event: ErrorEvent) => {
      console.error('Caught error:', event.error);
      setError(event.error);
      setHasError(true);
      // Prevent the white screen
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: 'red' }}>Something went wrong</h1>
        <p>There was an error loading the application:</p>
        <pre style={{ background: '#f7f7f7', padding: '10px', overflow: 'auto' }}>
          {error?.toString() || 'Unknown error'}
        </pre>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '8px 16px', background: '#4BD16F', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
        >
          Try again
        </button>
      </div>
    );
  }

  return children;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning className="font-sans bg-white">
        <ErrorBoundary>
          <ClientWeb3Provider>
            <AuthProvider>
              <PropertiesProvider>
                <MobileProvider>
                  {children}
                  <ForceNetworkSwitch />
                  <NetworkChangeHandler />
                </MobileProvider>
              </PropertiesProvider>
            </AuthProvider>
          </ClientWeb3Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
} 