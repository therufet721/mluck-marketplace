"use client";

import React from 'react';
import { useProperties } from '../../contexts/PropertiesContext';
import PropertyCard from '../../components/PropertyCard';
import CityFilter from '../../components/CityFilter';
import Spinner from '../../components/Spinner';

export default function DashboardClientContent() {
  const { properties, loading, error } = useProperties();

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
      <CityFilter />
      
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
            <p>No properties found</p>
          </div>
        )}
        
        {/* Coming soon card */}
        <PropertyCard isComingSoon={true} />
      </div>
    </main>
  );
} 