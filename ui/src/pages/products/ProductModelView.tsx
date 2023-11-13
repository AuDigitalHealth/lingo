import React, { useState } from 'react';
import { ProductModel } from '../../types/concept.ts';
import { useParams } from 'react-router-dom';

import { isFsnToggleOn } from '../../utils/helpers/conceptUtils.ts';

import { useConceptModel } from '../../hooks/api/products/useConceptModel.tsx';
import Loading from '../../components/Loading.tsx';
import ProductModelEdit from './ProductModelEdit.tsx';

function ProductModelView() {
  const { id } = useParams();

  const [fsnToggle, setFsnToggle] = useState<boolean>(isFsnToggleOn);
  const [productModel, setProductModel] = useState<ProductModel>();

  const { isLoading } = useConceptModel(
    id,
    reloadStateElements,
    setProductModel,
  );

  function reloadStateElements() {
    setFsnToggle(isFsnToggleOn);
  }

  if (isLoading) {
    return <Loading message={`Loading 7 Box model for ${id}`} />;
  }

  return (
    <ProductModelEdit
      productModel={productModel as ProductModel}
      readOnlyMode={true}
    />
  );
}

export default ProductModelView;
