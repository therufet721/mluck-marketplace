import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  containerStyles?: React.CSSProperties;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  containerStyles = {}
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State for dropdown
  const [selectedPage, setSelectedPage] = useState(currentPage);
  
  // Update URL when page changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', currentPage.toString());
    
    // Replace current URL with new parameters
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentPage, pathname, router, searchParams]);
  
  // Handle dropdown change
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const page = parseInt(e.target.value);
    setSelectedPage(page);
    onPageChange(page);
  };
  
  // Create array of page numbers for dropdown
  const pageOptions = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div 
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        margin: '20px 0',
        ...containerStyles
      }}
    >
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        style={{
          padding: '5px 10px',
          borderRadius: '5px',
          backgroundColor: currentPage === 1 ? '#f0f0f0' : '#4BD16F',
          color: currentPage === 1 ? '#aaa' : 'white',
          border: 'none',
          cursor: currentPage === 1 ? 'default' : 'pointer',
          fontSize: '0.8rem'
        }}
      >
        First
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '5px 10px',
          borderRadius: '5px',
          backgroundColor: currentPage === 1 ? '#f0f0f0' : '#4BD16F',
          color: currentPage === 1 ? '#aaa' : 'white',
          border: 'none',
          cursor: currentPage === 1 ? 'default' : 'pointer',
          fontSize: '0.8rem'
        }}
      >
        Prev
      </button>
      
      {/* Page selector dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ fontSize: '0.9rem' }}>Page</span>
        <select 
          value={selectedPage}
          onChange={handleDropdownChange}
          style={{
            padding: '3px 5px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            fontSize: '0.9rem',
            minWidth: '60px'
          }}
        >
          {pageOptions.map(page => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.9rem' }}>of {totalPages}</span>
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '5px 10px',
          borderRadius: '5px',
          backgroundColor: currentPage === totalPages ? '#f0f0f0' : '#4BD16F',
          color: currentPage === totalPages ? '#aaa' : 'white',
          border: 'none',
          cursor: currentPage === totalPages ? 'default' : 'pointer',
          fontSize: '0.8rem'
        }}
      >
        Next
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        style={{
          padding: '5px 10px',
          borderRadius: '5px',
          backgroundColor: currentPage === totalPages ? '#f0f0f0' : '#4BD16F',
          color: currentPage === totalPages ? '#aaa' : 'white',
          border: 'none',
          cursor: currentPage === totalPages ? 'default' : 'pointer',
          fontSize: '0.8rem'
        }}
      >
        Last
      </button>
    </div>
  );
};

export default Pagination; 