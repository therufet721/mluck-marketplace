import React from 'react';
import ClientHeader from './ClientHeader';

export default function Header({ title }: { title?: string }) {
  return <ClientHeader title={title} />;
} 