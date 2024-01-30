import Loading from '../../../components/Loading.tsx';
import React from 'react';

interface ProductLoaderProps {
  message: string;
}
export default function ProductLoader({ message }: ProductLoaderProps) {
  return (
    <div style={{ marginTop: '200px' }}>
      <Loading message={message} />
    </div>
  );
}
