import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { AddButton } from '../../../components/AddButton';
import { useAddButton } from '../../../hooks/useAddButton';
import { packSizeValidation } from '../../helpers/validationHelper.ts';

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

  const getInitialPackSizeData = () => ({
    packSize: undefined,
    nonDefiningProperties:
      formContext.formData.newPackSizeInput.nonDefiningProperties,
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
