import type { Metadata } from "next";
import "../src/app/globals.css";
import ClientWeb3Provider from "../components/providers/ClientWeb3Provider";

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
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-white">
        <ClientWeb3Provider>
          {children}
        </ClientWeb3Provider>
      </body>
    </html>
  );
} 