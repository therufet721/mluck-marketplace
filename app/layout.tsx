'use client';

import { Inter } from 'next/font/google';
import "./globals.css";
import { PropertiesProvider } from '../contexts/PropertiesContext';
import { MobileProvider } from '../contexts/MobileContext';
import { AuthProvider } from '../contexts/AuthContext';
import ClientWeb3Provider from "../components/providers/ClientWeb3Provider";
import ForceNetworkSwitch from '../components/ForceNetworkSwitch';
import NetworkChangeHandler from '../components/NetworkChangeHandler';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning className="font-sans bg-white">
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
      </body>
    </html>
  );
} 