import React from 'react';
import Header from '../../components/Header';
import PropertyCard from '../../components/PropertyCard';
import CityFilter from '../../components/CityFilter';
import { getProperties } from '../../lib/api';

// Since Next.js pages are server components by default, we need to mark this as async
export default async function Dashboard() {
  // Fetch properties from the API
  const properties = await getProperties();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Header />
      
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
            // Display a message if no properties are found
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
    </div>
  );
} 