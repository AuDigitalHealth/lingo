import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';

import {
  DevicePackageDetails,
  MedicationPackageDetails,
} from '../../../types/product.ts';
import Loading from '../../../components/Loading.tsx';
import React, { useState } from 'react';
import { Ticket } from '../../../types/tickets/ticket.ts';

import ProductPartialSave from './ProductPartialSave.tsx';

interface ProductPartialSaveModalProps {
  open: boolean;
  handleClose: () => void;
  packageDetails: MedicationPackageDetails | DevicePackageDetails | undefined;
  existingProductId?: string;
  ticket: Ticket;
  productStatus?: string | undefined;
}
export default function ProductPartialSaveModal({
  open,
  handleClose,
  packageDetails,
  existingProductId,
  ticket,
  productStatus,
}: ProductPartialSaveModalProps) {
  const [isUpdating, setUpdating] = useState(false);
  const closeHandle = () => {
    if (!isUpdating) {
      handleClose();
    }
  };
  return (
    <BaseModal open={open} handleClose={closeHandle}>
      <BaseModalHeader title={'Product Save Progress'} />
      <BaseModalBody>
        {!packageDetails ? (
          <Loading message={`Loading product save progress `} />
        ) : (
          <ProductPartialSave
            packageDetails={packageDetails}
            ticket={ticket}
            handleClose={handleClose}
            existingProductId={existingProductId}
            productStatus={productStatus}
            setUpdating={setUpdating}
            isUpdating={isUpdating}
          />
        )}
      </BaseModalBody>
    </BaseModal>
  );
}
