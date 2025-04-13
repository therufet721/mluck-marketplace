import React from 'react';

export default function CityFilter() {
  const cities = ["All", "Baku", "Dubai", "Budapest"];
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', margin: '32px 0' }}>
      {cities.map((city, index) => (
        <button 
          key={index} 
          style={{ 
            padding: '8px 32px', 
            borderRadius: '9999px', 
            backgroundColor: index === 0 ? '#4BD16F' : '#f3f4f6',
            color: index === 0 ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {city}
        </button>
      ))}
    </div>
  );
} 