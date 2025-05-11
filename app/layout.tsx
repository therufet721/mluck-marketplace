import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import ClientWeb3Provider from "../components/providers/ClientWeb3Provider";
import ForceNetworkSwitch from '../components/ForceNetworkSwitch';
import NetworkChangeHandler from '../components/NetworkChangeHandler';
import { PropertiesProvider } from '../contexts/PropertiesContext';
import { MobileProvider } from '../contexts/MobileContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Mluck Marketplace",
  description: "Find your lucky property",
  icons: {
    icon: "/Logo.svg",
    apple: "/Logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning className="font-sans bg-white">
        <ClientWeb3Provider>
          <PropertiesProvider>
            <MobileProvider>
              {children}
              <ForceNetworkSwitch />
              <NetworkChangeHandler />
            </MobileProvider>
          </PropertiesProvider>
        </ClientWeb3Provider>
      </body>
    </html>
  );
} 