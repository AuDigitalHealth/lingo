import React from 'react';
import { ProductModel } from '../../types/concept.ts';
import { useLocation } from 'react-router-dom';

import ProductModelEdit from './ProductModelEdit.tsx';

interface LocationState {
  productModel: ProductModel;
}
function ProductModelReadonly() {
  const location = useLocation();

  if (location !== null && location.state) {
    const productModel = (location.state as LocationState).productModel;
    if (productModel !== null) {
      return (
        <ProductModelEdit productModel={productModel} readOnlyMode={true} />
      );
    }
  }
}

export default ProductModelReadonly;
