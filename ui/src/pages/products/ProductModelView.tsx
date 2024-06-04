import React, { useState } from 'react';
import { ProductModel } from '../../types/concept.ts';
import { useParams } from 'react-router-dom';

import { isFsnToggleOn } from '../../utils/helpers/conceptUtils.ts';

import { useConceptModel } from '../../hooks/api/products/useConceptModel.tsx';
import Loading from '../../components/Loading.tsx';
import ProductModelEdit from './ProductModelEdit.tsx';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore.ts';

interface ProductModelViewProps {
  branch?: string;
}
function ProductModelView({ branch }: ProductModelViewProps) {
  const params = useParams();
  const { conceptId } = useParams();
  const branchPath = branch
    ? branch
    : useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch;

  const [fsnToggle, setFsnToggle] = useState<boolean>(isFsnToggleOn);
  const [productModel, setProductModel] = useState<ProductModel>();

  const { isLoading } = useConceptModel(
    conceptId,
    reloadStateElements,
    setProductModel,
    branchPath,
  );

  function reloadStateElements() {
    setFsnToggle(isFsnToggleOn);
  }

  if (isLoading) {
    return <Loading message={`Loading 7 Box model for ${conceptId}`} />;
  }

  return (
    <ProductModelEdit
      branch={branch}
      productModel={productModel as ProductModel}
      readOnlyMode={true}
    />
  );
}

export default ProductModelView;
