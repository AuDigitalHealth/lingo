import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { AddButton } from '../../../components/AddButton';
import { useAddButton } from '../../../hooks/useAddButton';
import { validator } from '../../helpers/validator';
import { normalizeSchema } from '../../helpers/rjsfUtils';
import { getSubSchema } from '../../helpers/validationHelper';

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

    const validationSchema = normalizeSchema(
      getBrandValidationSchema(formContext.schema),
    );
    const ajvErrors = validator.validateFormData(
      { brandDetails: sourceData },
      validationSchema,
      formContext.uiSchema.brands?.items,
    );
    formContext.onError(prefixAjvErrorsForBrand(ajvErrors.errors));
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
function prefixAjvErrorsForBrand(
  errors: any[],
  prefixInstancePath = '/newBrandInput/brandDetails',
  prefixProperty = 'newBrandInput.brandDetails',
) {
  if (!Array.isArray(errors)) return errors;

  return errors.map(err => {
    const updated = { ...err };

    // Prefix instancePath (AJV path)
    if (updated.instancePath) {
      updated.instancePath = `${prefixInstancePath}${updated.instancePath}`;
    } else {
      updated.instancePath = prefixInstancePath;
    }

    // Prefix schemaPath only if exists
    if (updated.schemaPath) {
      updated.schemaPath = updated.schemaPath.replace(
        /^#\//,
        `#/${prefixProperty.replace(/\./g, '/')}/`,
      );
    }

    // Prefix .property field (used by some validators)
    if (updated.property) {
      updated.property = `${prefixProperty}.${updated.property.replace(/^\./, '')}`;
    } else {
      updated.property = prefixProperty;
    }

    return updated;
  });
}

export default AddBrandButton;
