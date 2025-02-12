import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';

import { ProductCreationDetails, ProductType } from '../../../types/product.ts';
import ProductPreviewCreateOrViewMode from '../ProductPreviewCreateOrViewMode.tsx';
import Loading from '../../../components/Loading.tsx';
import React from 'react';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { Box } from '@mui/system';

interface ProductPreviewCreateModalProps {
  open: boolean;
  handleClose: (
    event: object,
    reason: 'backdropClick' | 'escapeKeyDown',
  ) => void;
  productCreationDetails: ProductCreationDetails | undefined;
  productType: ProductType;
  branch: string;
  ticket: Ticket;
}
export default function ProductPreviewCreateModal({
  open,
  handleClose,
  productCreationDetails,
  branch,
  ticket,
}: ProductPreviewCreateModalProps) {
  console.log('hey!!!');
  return (
    <BaseModal
      open={open}
      handleClose={handleClose}
      data-testid={'preview-modal'}
      sx={{ width: '75%' }}
    >
      <BaseModalHeader title={'Preview New Product'} />
      <BaseModalBody>
        <Box height={'90%'} overflow={'auto'} width={'100%'}>
          {!productCreationDetails ? (
            <Loading message={`Loading Product Preview details`} />
          ) : (
            <ProductPreviewCreateOrViewMode
              productCreationDetails={productCreationDetails}
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
