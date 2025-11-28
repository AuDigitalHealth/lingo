import React, { useMemo } from 'react';
import { FieldProps } from '@rjsf/utils';
import { AddButton } from '../../../components/AddButton';
import { useAddButton } from '../../../hooks/useAddButton';
import { validator } from '../../helpers/validator';
import { normalizeSchema } from '../../helpers/rjsfUtils';
import {
  getSubSchema,
  prefixAjvErrorsForPackAndBrand,
} from '../../helpers/validationHelper';

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

  const getBrandValidationSchema = (rootSchema: any) => {
    if (!rootSchema || !rootSchema.$defs) return null;
    const brand = getSubSchema(rootSchema, '$defs.BrandDetails');
    if (!brand) return null;

    return {
      type: 'object',
      properties: {
        brandDetails: brand,
      },
      $defs: rootSchema.$defs,
    };
  };
  const brandValidationSchema = useMemo(
    () => normalizeSchema(getBrandValidationSchema(formContext.schema)),
    [formContext.schema],
  );

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

    const ajvErrors = validator.validateFormData(
      { brandDetails: sourceData },
      brandValidationSchema,
      formContext.uiSchema.brands?.items,
    );
    formContext.onError(
      prefixAjvErrorsForPackAndBrand(
        ajvErrors.errors,
        '/newBrandInput/brandDetails',
        'newBrandInput.brandDetails',
      ),
    );
    if (ajvErrors && ajvErrors.errors.length > 0) {
      return false;
    }

    return !duplicateInTarget && !duplicateInExisting;
  };

  const getInitialBrandData = () => ({
    brand: undefined,
    nonDefiningProperties:
      formContext.formData.newBrandInput.nonDefiningProperties || [],
  });

  const { handleAddClick: originalAddClick, isEnabled } = useAddButton({
    formContext,
    sourcePath,
    targetPath,
    existingPath,
    validationFn: brandValidation,
    getInitialSourceData: getInitialBrandData,
  });

  const handleAddClick = () => {
    originalAddClick();
  };

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
