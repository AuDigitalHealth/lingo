import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';

import React from 'react';
import { Iteration } from '../../../../types/tickets/ticket.ts';
import ReleaseCreateOrUpdate from './ReleaseCreateOrUpdate.tsx';

interface ReleaseSettingsModalProps {
  open: boolean;
  handleClose: () => void;
  iteration?: Iteration;
}
export default function ReleaseSettingsModal({
  open,
  handleClose,
  iteration,
}: ReleaseSettingsModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} sx={{ minWidth: '400px' }}>
      <BaseModalHeader
        title={
          iteration ? `Update Release ${iteration.name}` : 'Create New Release'
        }
      />
      <BaseModalBody>
        <ReleaseCreateOrUpdate
          iteration={iteration}
          handleClose={handleClose}
        />
      </BaseModalBody>
    </BaseModal>
  );
}
