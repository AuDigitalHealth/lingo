import React from 'react';
import { ProductModel } from '../../types/concept.ts';
import { useLocation } from 'react-router-dom';

import ProductModelEdit from './ProductModelEdit.tsx';

interface LocationState {
  productModel: ProductModel;
  branch: string;
}
function ProductModelReadonly() {
  const location = useLocation();

  if (location !== null && location.state) {
    const locationState = location.state as LocationState;
    if (locationState.productModel !== null) {
      return (
        <ProductModelEdit
          productModel={locationState.productModel}
          readOnlyMode={true}
          branch={locationState.branch}
        />
      );
    }
  }
}

export default ProductModelReadonly;
