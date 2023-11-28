import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';

import { ProductCreationDetails, ProductType } from '../../../types/product.ts';
import ProductModelEdit from '../ProductModelEdit.tsx';
import Loading from '../../../components/Loading.tsx';
import React from 'react';
import { Ticket } from '../../../types/tickets/ticket.ts';

interface ProductPreview7BoxModalProps {
  open: boolean;
  handleClose: () => void;
  productCreationDetails: ProductCreationDetails | undefined;
  productType: ProductType;
  branch: string;
  ticket: Ticket;
}
export default function ProductPreview7BoxModal({
  open,
  handleClose,
  productCreationDetails,
  branch,
  ticket,
}: ProductPreview7BoxModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title={'Preview New Product'} />
      <BaseModalBody>
        {!productCreationDetails ? (
          <Loading message={`Loading Product Preview details`} />
        ) : (
          <ProductModelEdit
            productCreationDetails={productCreationDetails}
            handleClose={handleClose}
            readOnlyMode={false}
            branch={branch}
            productModel={productCreationDetails.productSummary}
            ticket={ticket}
          />
        )}
      </BaseModalBody>
    </BaseModal>
  );
}
