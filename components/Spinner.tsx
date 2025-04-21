'use client';

import React from 'react';

export default function Spinner() {
  return (
    <div
      style={{
        display: 'inline-block',
        width: '30px',
        height: '30px',
        border: '3px solid rgba(75, 209, 111, 0.3)',
        borderRadius: '50%',
        borderTopColor: '#4BD16F',
        animation: 'spin 1s ease-in-out infinite',
      }}
    >
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
} 