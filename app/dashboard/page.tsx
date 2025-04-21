import React from 'react';
import Header from '../../components/Header';
import DashboardClientContent from './DashboardClientContent';

export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Header />
      <DashboardClientContent />
    </div>
  );
} 