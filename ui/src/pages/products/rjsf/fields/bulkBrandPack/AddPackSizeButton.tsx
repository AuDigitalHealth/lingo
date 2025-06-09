import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { AddButton } from '../../../components/AddButton';
import { useAddButton } from '../../../hooks/useAddButton';

interface AddButtonFieldProps extends FieldProps {
  sourcePath?: string;
  targetPath?: string;
  existingPath?: string;
}

const AddPackSizeButton: React.FC<AddButtonFieldProps> = props => {
  const { formContext, uiSchema } = props;
  const options = uiSchema?.['ui:options'] || {};
  const {
    tooltipTitle = 'Add Pack Size',
    sourcePath = 'newPackSizeInput',
    targetPath = 'packSizes',
    existingPath = 'existingPackSizes',
  } = options;

  const packSizeValidation = (
    sourceData: any,
    targetData: any[],
    existingData: any[],
  ) => {
    if (!sourceData || typeof sourceData !== 'object') return false;

    const packSize = sourceData.packSize;
    if (!packSize || isNaN(packSize) || packSize <= 0) return false;

    // Check for duplicates in target array
    const duplicateInTarget = targetData.some(
      (item: any) => item.packSize === packSize,
    );

    // Check for duplicates in existing values array
    const duplicateInExisting = existingData.some(
      (item: any) => item.packSize === packSize,
    );

    return !duplicateInTarget && !duplicateInExisting;
  };

  const getInitialPackSizeData = () => ({
    packSize: undefined,
    externalIdentifiers: [],
  });

  const { handleAddClick, isEnabled } = useAddButton({
    formContext,
    sourcePath,
    targetPath,
    existingPath,
    validationFn: packSizeValidation,
    getInitialSourceData: getInitialPackSizeData,
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

export default AddPackSizeButton;
