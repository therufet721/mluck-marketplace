import React from 'react';

interface CityFilterProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}

export default function CityFilter({ selectedCity = 'All', onCityChange }: CityFilterProps) {
  const cities = ["All", "Baku", "Dubai", "Budapest"];
  
  const handleCityClick = (city: string) => {
    if (onCityChange) {
      onCityChange(city);
    }
  };
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', margin: '32px 0' }}>
      {cities.map((city, index) => (
        <button 
          key={index} 
          style={{ 
            padding: '8px 32px', 
            borderRadius: '9999px', 
            backgroundColor: city === selectedCity ? '#4BD16F' : '#f3f4f6',
            color: city === selectedCity ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => handleCityClick(city)}
        >
          {city}
        </button>
      ))}
    </div>
  );
} 