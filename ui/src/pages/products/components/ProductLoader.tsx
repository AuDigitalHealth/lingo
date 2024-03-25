import Loading from '../../../components/Loading.tsx';
import React from 'react';

interface ProductLoaderProps {
  message: string;
  marginTop?: string;
}
export default function ProductLoader({
  message,
  marginTop,
}: ProductLoaderProps) {
  return (
    <div style={{ marginTop: marginTop ? marginTop : '200px' }}>
      <Loading message={message} />
    </div>
  );
}
