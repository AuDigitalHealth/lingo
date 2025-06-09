import { useCallback } from 'react';

interface UseAddButtonProps {
  formContext: any;
  sourcePath: string;
  targetPath: string;
  existingPath: string;
  validationFn: (
    sourceData: any,
    targetData: any[],
    existingData: any[],
  ) => boolean;
  getInitialSourceData: () => any;
}

export const useAddButton = ({
  formContext,
  sourcePath,
  targetPath,
  existingPath,
  validationFn,
  getInitialSourceData,
}: UseAddButtonProps) => {
  const handleAddClick = useCallback(() => {
    if (!formContext?.formData) return;

    const sourceData = formContext.formData[sourcePath];
    const targetData = formContext.formData[targetPath] || [];
    const existingData = formContext.formData[existingPath] || [];

    if (validationFn(sourceData, targetData, existingData)) {
      // Add the item
      const newTargetData = [...targetData, { ...sourceData }];

      // Clear the source
      const newFormData = {
        ...formContext.formData,
        [targetPath]: newTargetData,
        [sourcePath]: getInitialSourceData(),
      };

      // Update form data
      if (formContext.onFormDataChange) {
        formContext.onFormDataChange(newFormData);
      }
    }
  }, [
    formContext,
    sourcePath,
    targetPath,
    existingPath,
    validationFn,
    getInitialSourceData,
  ]);

  const getIsEnabled = useCallback(() => {
    if (!formContext?.formData) return false;

    const sourceData = formContext.formData[sourcePath];
    const targetData = formContext.formData[targetPath] || [];
    const existingData = formContext.formData[existingPath] || [];

    return validationFn(sourceData, targetData, existingData);
  }, [formContext, sourcePath, targetPath, existingPath, validationFn]);

  return {
    handleAddClick,
    isEnabled: getIsEnabled(),
  };
};
