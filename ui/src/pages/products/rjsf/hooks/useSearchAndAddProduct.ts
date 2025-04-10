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

import { useState } from 'react';
import _get from 'lodash/get';
import _set from 'lodash/set';
import { ProductAddDetails } from '../../../../types/product';

const useSearchAndAddProduct = (formContext, idSchema) => {
  const [openSearchModal, setOpenSearchModal] = useState(false);

  const handleOpenSearchModal = () => setOpenSearchModal(true);
  const handleCloseSearchModal = () => setOpenSearchModal(false);

  const handleAddProduct = (product: ProductAddDetails) => {
    if (!formContext?.onChange) {
      console.error(
        'formContext.onChange is undefined. Cannot update formData.',
      );
      return;
    }

    const fieldNameRaw = idSchema?.$id
      ? idSchema.$id.replace('root_', '')
      : undefined;
    if (!fieldNameRaw) {
      console.error(
        'Field name is undefined. Cannot determine where to add product.',
      );
      return;
    }

    const fieldName = fieldNameRaw.replace(/_(\d+)_/g, '[$1].');

    const fullFormData = formContext.formData || {};
    const currentArray = _get(fullFormData, fieldName, []);

    if (!Array.isArray(currentArray)) {
      console.error(
        `Expected an array at '${fieldName}', but found:`,
        currentArray,
      );
      return;
    }

    const updatedArray = [...currentArray, product];
    const newFormData = { ...fullFormData };
    _set(newFormData, fieldName, updatedArray);
    formContext.onChange(newFormData);
    handleCloseSearchModal();
  };

  return {
    openSearchModal,
    handleOpenSearchModal,
    handleCloseSearchModal,
    handleAddProduct,
  };
};

export default useSearchAndAddProduct;
