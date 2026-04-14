import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';
import SynonymConfigurationForm from './SynonymConfigurationForm.tsx';
import { SynonymConfiguration } from '../../../../types/tickets/ticket.ts';

interface SynonymConfigurationModalProps {
  open: boolean;
  handleClose: () => void;
  synonymConfiguration?: SynonymConfiguration;
}

export default function SynonymConfigurationModal({
  open,
  handleClose,
  synonymConfiguration,
}: SynonymConfigurationModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} sx={{ minWidth: '500px' }}>
      <BaseModalHeader
        title={
          synonymConfiguration
            ? 'Edit Synonym Configuration'
            : 'Create New Synonym Configuration'
        }
      />
      <BaseModalBody>
        <SynonymConfigurationForm
          handleClose={handleClose}
          synonymConfiguration={synonymConfiguration}
        />
      </BaseModalBody>
    </BaseModal>
  );
}
