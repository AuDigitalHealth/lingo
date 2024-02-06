import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';

import React from 'react';
import { LabelType } from '../../../../types/tickets/ticket.ts';
import LabelCreateOrUpdate from './LabelCreateOrUpdate.tsx';

interface LabelSettingsModalProps {
  open: boolean;
  handleClose: () => void;
  labelType?: LabelType;
}
export default function LabelSettingsModal({
  open,
  handleClose,
  labelType,
}: LabelSettingsModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} sx={{ minWidth: '400px' }}>
      <BaseModalHeader
        title={
          labelType ? `Update Label ${labelType.name}` : 'Create New Label'
        }
      />
      <BaseModalBody>
        <LabelCreateOrUpdate labelType={labelType} handleClose={handleClose} />
      </BaseModalBody>
    </BaseModal>
  );
}
