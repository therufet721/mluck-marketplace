import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "../src/app/globals.css";
import ClientWeb3Provider from "../components/providers/ClientWeb3Provider";
import ForceNetworkSwitch from '../components/ForceNetworkSwitch';
import NetworkChangeHandler from '../components/NetworkChangeHandler';
import { PropertiesProvider } from '../contexts/PropertiesContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "MLuck Marketplace",
  description: "Find your lucky property",
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
            {children}
            <ForceNetworkSwitch />
            <NetworkChangeHandler />
          </PropertiesProvider>
        </ClientWeb3Provider>
      </body>
    </html>
  );
} 