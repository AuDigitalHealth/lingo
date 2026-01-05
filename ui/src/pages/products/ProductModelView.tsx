import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';

import { isFsnToggleOn } from '../../utils/helpers/conceptUtils.ts';

import { useConceptModel } from '../../hooks/api/products/useConceptModel.tsx';
import Loading from '../../components/Loading.tsx';
import ProductPreviewSaveOrViewMode from './ProductPreviewSaveOrViewMode.tsx';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore.ts';
import { useProjectFromUrlProjectPath } from '../../hooks/useProjectFromUrlPath.tsx';

interface ProductModelViewProps {
  branch?: string;
}
function ProductModelView({ branch }: ProductModelViewProps) {
  const { conceptId, project: projectKey } = useParams();
  const project = useProjectFromUrlProjectPath();
  const branchPath = branch
    ? branch
    : projectKey
      ? project?.branchPath
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
    return <Loading message={`Loading box model for ${conceptId}`} />;
  }

  if (data) {
    return (
      <ProductPreviewSaveOrViewMode
        branch={branchPath}
        productModelResponse={data}
        readOnlyMode={true}
      />
    );
  }
  return <></>;
}

export default ProductModelView;
