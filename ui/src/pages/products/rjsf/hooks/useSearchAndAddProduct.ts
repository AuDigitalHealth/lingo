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
