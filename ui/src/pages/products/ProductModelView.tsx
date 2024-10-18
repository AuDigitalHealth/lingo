import React, { useCallback, useState } from 'react';
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
  const { conceptId } = useParams();
  const branchPath = branch
    ? branch
    : useApplicationConfigStore.getState().applicationConfig?.apDefaultBranch;

  const [, setFsnToggle] = useState<boolean>(isFsnToggleOn);

  const reloadStateElements = useCallback(() => {
    setFsnToggle(isFsnToggleOn);
  }, [setFsnToggle]);

  const { isLoading, data } = useConceptModel(
    conceptId,
    reloadStateElements,
    branchPath,
  );

  if (isLoading) {
    return <Loading message={`Loading 7 Box model for ${conceptId}`} />;
  }

  if (data) {
    return (
      <ProductModelEdit
        branch={branchPath}
        productModel={data}
        readOnlyMode={true}
      />
    );
  }
  return <></>;
}

export default ProductModelView;
