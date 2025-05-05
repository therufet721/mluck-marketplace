"use client";

import React, { useEffect, useState } from 'react';
import { useProperties } from '../../contexts/PropertiesContext';
import PropertyCard from '../../components/PropertyCard';
import CityFilter from '../../components/CityFilter';
import Spinner from '../../components/Spinner';
import { useRouter, useSearchParams } from 'next/navigation';
import { Property } from '../../types';
import { getProperties } from '../../lib/api';

export default function DashboardClientContent() {
  const { properties: contextProperties, loading: contextLoading, error: contextError } = useProperties();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const cityFilter = searchParams.get('city') || 'All';

  // Handle city filter change
  const handleCityChange = (city: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (city === 'All') {
      params.delete('city');
    } else {
      params.set('city', city);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  // Fetch properties with city filter when cityFilter changes
  useEffect(() => {
    async function fetchFilteredProperties() {
      try {
        setLoading(true);
        const filteredProperties = await getProperties(cityFilter);
        setProperties(filteredProperties);
        setError(null);
      } catch (err) {
        console.error("Error fetching filtered properties:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredProperties();
  }, [cityFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: 'red' }}>
        <p>Error loading properties: {error.message}</p>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      <CityFilter selectedCity={cityFilter} onCityChange={handleCityChange} />
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '32px',
        marginBottom: '64px'
      }}>
        {properties.length > 0 ? (
          properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '64px 0' 
          }}>
            <p>{cityFilter !== 'All' ? `No properties found in ${cityFilter}` : 'No properties found'}</p>
          </div>
        )}
        
        {/* Coming soon card */}
        <PropertyCard isComingSoon={true} />
      </div>
    </main>
  );
} 