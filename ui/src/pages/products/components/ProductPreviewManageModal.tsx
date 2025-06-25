import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';

import { ProductSaveDetails, ProductType } from '../../../types/product.ts';
import ProductPreviewSaveOrViewMode from '../ProductPreviewSaveOrViewMode.tsx';
import Loading from '../../../components/Loading.tsx';
import React from 'react';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { Box } from '@mui/system';

interface ProductPreviewManageModalProps {
  open: boolean;
  handleClose: (
    event: object,
    reason: 'backdropClick' | 'escapeKeyDown',
  ) => void;
  productCreationDetails: ProductSaveDetails | undefined;
  productType: ProductType;
  branch: string;
  ticket: Ticket;
  isProductUpdate:boolean;
}
export default function ProductPreviewManageModal({
  open,
  handleClose,
  productCreationDetails,
  branch,
  ticket,
                                                    isProductUpdate
}: ProductPreviewManageModalProps) {
  return (
    <BaseModal
      open={open}
      handleClose={handleClose}
      data-testid={'preview-modal'}
      sx={{ width: '75%' }}
    >
      <BaseModalHeader title={isProductUpdate ? 'Preview Update Product':'Preview New Product'} />
      <BaseModalBody>
        <Box height={'90%'} overflow={'auto'} width={'100%'}>
          {!productCreationDetails ? (
            <Loading message={`Loading Product Preview details`} />
          ) : (
            <ProductPreviewSaveOrViewMode
              productSaveDetails={productCreationDetails}
              handleClose={handleClose}
              readOnlyMode={false}
              branch={branch}
              productModel={productCreationDetails.productSummary}
              ticket={ticket}
            />
          )}
        </Box>
      </BaseModalBody>
    </BaseModal>
  );
}
