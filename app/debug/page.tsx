'use client';

import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';

export default function DebugPage() {
  const [clientInfo, setClientInfo] = useState<{
    userAgent: string;
    windowDimensions: string;
    navigatorInfo: any;
    jsEnabled: boolean;
    cookiesEnabled: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
  }>({
    userAgent: '',
    windowDimensions: '',
    navigatorInfo: {},
    jsEnabled: true,
    cookiesEnabled: false,
    localStorage: false,
    sessionStorage: false,
  });

  const [loadedModules, setLoadedModules] = useState<{
    react: boolean;
    nextjs: boolean;
    wagmi: boolean;
    rainbowkit: boolean;
    viem: boolean;
  }>({
    react: false,
    nextjs: false,
    wagmi: false,
    rainbowkit: false,
    viem: false,
  });

  useEffect(() => {
    // Basic client information
    setClientInfo({
      userAgent: navigator.userAgent,
      windowDimensions: `${window.innerWidth}x${window.innerHeight}`,
      navigatorInfo: {
        language: navigator.language,
        onLine: navigator.onLine,
        platform: navigator.platform,
        vendor: navigator.vendor,
      },
      jsEnabled: true,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
    });

    // Check loaded modules
    try {
      // We use dynamic imports to check if modules are loading correctly
      Promise.all([
        import('react').then(() => setLoadedModules(prev => ({ ...prev, react: true }))),
        import('next/navigation').then(() => setLoadedModules(prev => ({ ...prev, nextjs: true }))),
        import('wagmi').then(() => setLoadedModules(prev => ({ ...prev, wagmi: true }))),
        import('@rainbow-me/rainbowkit').then(() => setLoadedModules(prev => ({ ...prev, rainbowkit: true }))),
        import('viem').then(() => setLoadedModules(prev => ({ ...prev, viem: true }))),
      ]).catch(err => {
        console.error('Error loading modules:', err);
      });
    } catch (error) {
      console.error('Failed to check modules:', error);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Header />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          Diagnostic Information
        </h1>
        
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Client Environment</h2>
          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflowX: 'auto' }}>
            {JSON.stringify(clientInfo, null, 2)}
          </pre>
        </section>
        
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Module Loading Status</h2>
          <ul style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
            {Object.entries(loadedModules).map(([module, loaded]) => (
              <li key={module} style={{ 
                padding: '8px 0', 
                borderBottom: '1px solid #eee', 
                display: 'flex', 
                justifyContent: 'space-between' 
              }}>
                <span>{module}</span>
                <span style={{ 
                  color: loaded ? 'green' : 'red', 
                  fontWeight: 'bold' 
                }}>
                  {loaded ? '✓ Loaded' : '✗ Failed'}
                </span>
              </li>
            ))}
          </ul>
        </section>
        
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Connection Test</h2>
          <p>
            This page loaded successfully. If you can see this content but the main app shows a white screen,
            there's likely an issue with one of the app components or providers.
          </p>
        </section>
      </main>
    </div>
  );
} 