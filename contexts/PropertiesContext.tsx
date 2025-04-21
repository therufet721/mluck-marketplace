"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Property } from '../types'; // Assuming types.ts is in the root

// Define the shape of the context data
interface PropertiesContextProps {
  properties: Property[];
  loading: boolean;
  error: Error | null;
  fetchProperties: () => Promise<void>; // Add fetchProperties to context
}

// Create the context with a default value
const PropertiesContext = createContext<PropertiesContextProps | undefined>(undefined);

// Define the API URL (consider moving this to a config file)
const API_URL = 'https://chain.mluck.io';

// Function to fetch properties data from the API
async function fetchPropertiesData(): Promise<Property[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/asset/properties`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    // Map the raw API data to the Property type
    return data.data.properties.map((property: any) => ({
      id: property.address,
      address: property.address,
      title: property.name,
      type: property.type,
      rental_income: property.rental_income === 1 ? "Yes" : "No",
      apy: property.apy,
      price: property.price,
      slotContract: property.address, // Use the property address as the slot contract address
    }));
  } catch (error) {
    console.error("Error fetching properties:", error);
    // Re-throw the error so the provider can catch it
    throw error;
  }
}


// Create the provider component
interface PropertiesProviderProps {
  children: ReactNode;
}

export const PropertiesProvider: React.FC<PropertiesProviderProps> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPropertiesData();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch properties'));
      setProperties([]); // Clear properties on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch properties when the provider mounts
  useEffect(() => {
    fetchProperties();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <PropertiesContext.Provider value={{ properties, loading, error, fetchProperties }}>
      {children}
    </PropertiesContext.Provider>
  );
};

// Create a custom hook for easy context consumption
export const useProperties = (): PropertiesContextProps => {
  const context = useContext(PropertiesContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertiesProvider');
  }
  return context;
}; 