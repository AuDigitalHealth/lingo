import React from 'react';
import { ProductModel } from '../../types/concept.ts';
import { useLocation } from 'react-router-dom';

import ProductModelEdit from './ProductModelEdit.tsx';

function ProductModelReadonly() {
  const { state } = useLocation();
  if (state && state.productModel !== null) {
    return (
      <ProductModelEdit
        productModel={state.productModel as ProductModel}
        readOnlyMode={true}
      />
    );
  }
}

export default ProductModelReadonly;
