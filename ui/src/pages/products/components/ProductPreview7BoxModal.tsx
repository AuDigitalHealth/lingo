import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';

import { ProductModel } from '../../../types/concept.ts';

import { ProductType } from '../../../types/product.ts';
import ProductModelEdit from '../ProductModelEdit.tsx';
import Loading from '../../../components/Loading.tsx';
import React from 'react';

interface ProductPreview7BoxModalProps {
  open: boolean;
  handleClose: () => void;
  productModel: ProductModel | undefined;
  productType: ProductType;
  branch: string;
}
export default function ProductPreview7BoxModal({
  open,
  handleClose,
  productModel,
  branch,
}: ProductPreview7BoxModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title={'Preview New Product'} />
      <BaseModalBody>
        {!productModel ? (
          <Loading message={`Loading Product Preview details`} />
        ) : (
          <ProductModelEdit
            productModel={productModel}
            handleClose={handleClose}
            readOnlyMode={false}
            branch={branch}
          />
        )}
      </BaseModalBody>
    </BaseModal>
  );
}
