import React from 'react';
import { ProductModel } from '../../types/concept.ts';
import { useLocation, useParams } from 'react-router-dom';

import ProductModelEdit from './ProductModelEdit.tsx';
import ProductModelView from './ProductModelView.tsx';

interface LocationState {
  productModel: ProductModel | null;
  branch: string;
}
interface ProductModelReadonlyProps {
  branch?: string;
}
function ProductModelReadonly({ branch }: ProductModelReadonlyProps) {
  const location = useLocation();
  const { id } = useParams();

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
    } else {
      return <></>;
    }
  } else if (id) {
    return <ProductModelView branch={branch} />;
  } else {
    return <></>;
  }
}

export default ProductModelReadonly;
