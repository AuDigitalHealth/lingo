import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { AddButton } from '../../../components/AddButton';
import { useAddButton } from '../../../hooks/useAddButton';

interface AddBrandButtonFieldProps extends FieldProps {
  sourcePath?: string;
  targetPath?: string;
  existingPath?: string;
}

const AddBrandButton: React.FC<AddBrandButtonFieldProps> = props => {
  const { formContext, uiSchema } = props;
  const options = uiSchema?.['ui:options'] || {};
  const {
    tooltipTitle = 'Add Brand',
    sourcePath = 'newBrandInput',
    targetPath = 'brands',
    existingPath = 'existingBrands',
  } = options;

  const brandValidation = (
    sourceData: any,
    targetData: any[],
    existingData: any[],
  ) => {
    if (!sourceData || typeof sourceData !== 'object') return false;

    const brand = sourceData.brand;
    if (!brand || !brand.conceptId) return false;

    // Check for duplicates in target array
    const duplicateInTarget = targetData.some(
      (item: any) => item.brand?.conceptId === brand.conceptId,
    );

    // Check for duplicates in existing values array
    const duplicateInExisting = existingData.some(
      (item: any) => item.brand?.conceptId === brand.conceptId,
    );

    return !duplicateInTarget && !duplicateInExisting;
  };

  const getInitialBrandData = () => ({
    brand: undefined,
    externalIdentifiers: [],
  });

  const { handleAddClick, isEnabled } = useAddButton({
    formContext,
    sourcePath,
    targetPath,
    existingPath,
    validationFn: brandValidation,
    getInitialSourceData: getInitialBrandData,
  });

  return (
    <AddButton
      {...props}
      tooltipTitle={tooltipTitle}
      onClick={handleAddClick}
      isEnabled={isEnabled}
      sx={{ marginLeft: '-20px' }}
    />
  );
};

export default AddBrandButton;
