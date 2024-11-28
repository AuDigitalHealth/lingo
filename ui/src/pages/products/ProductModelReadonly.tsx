import React from 'react';
import { ProductSummary } from '../../types/concept.ts';
import { useLocation, useParams } from 'react-router-dom';

import ProductPreviewCreateOrViewMode from './ProductPreviewCreateOrViewMode.tsx';
import ProductModelView from './ProductModelView.tsx';

interface LocationState {
  productModel: ProductSummary | null;
  branch: string;
}
interface ProductModelReadonlyProps {
  branch?: string;
}
function ProductModelReadonly({ branch }: ProductModelReadonlyProps) {
  const location = useLocation();
  const { conceptId } = useParams();

  if (location !== null && location.state) {
    const locationState = location.state as LocationState;
    if (locationState.productModel !== null) {
      return (
        <ProductPreviewCreateOrViewMode
          productModel={locationState.productModel}
          readOnlyMode={true}
          branch={locationState.branch}
        />
      );
    } else if (conceptId) {
      console.log('Product model not found fallback to id loading');
      return <ProductModelView branch={branch} />;
    } else {
      console.log('Product model and Id not found');
      return <></>;
    }
  } else if (conceptId) {
    return <ProductModelView branch={branch} />;
  } else {
    console.log('Product model and Id not found');
    return <></>;
  }
}

export default ProductModelReadonly;
