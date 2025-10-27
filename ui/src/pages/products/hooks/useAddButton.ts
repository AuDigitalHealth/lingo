///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

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
  ) => boolean | string;
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

    const newTargetData = [...targetData, { ...sourceData }];
    const newFormData = {
      ...formContext.formData,
      [targetPath]: newTargetData,
      [sourcePath]: getInitialSourceData(),
    };

    if (formContext.onFormDataChange) {
      formContext.onFormDataChange(newFormData);
    }
  }, [formContext, sourcePath, targetPath, getInitialSourceData]);
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
