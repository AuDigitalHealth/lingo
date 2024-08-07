import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';

import React from 'react';
import { ExternalRequestor } from '../../../../types/tickets/ticket.ts';
import ExternalRequestorCreateOrUpdate from './ExternalRequestorCreateOrUpdate.tsx';

interface ExternalRequestorSettingsModalProps {
  open: boolean;
  handleClose: () => void;
  externalRequestor?: ExternalRequestor;
}
export default function ExternalRequestorSettingsModal({
  open,
  handleClose,
  externalRequestor,
}: ExternalRequestorSettingsModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} sx={{ minWidth: '400px' }}>
      <BaseModalHeader
        title={
          externalRequestor
            ? `Update External requestor ${externalRequestor.name}`
            : 'Create New External Requester'
        }
      />
      <BaseModalBody>
        <ExternalRequestorCreateOrUpdate
          externalRequestor={externalRequestor}
          handleClose={handleClose}
        />
      </BaseModalBody>
    </BaseModal>
  );
}
