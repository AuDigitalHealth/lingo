import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';

import ExternalProcessCreate from './ExternalProcessesCreate.tsx';

interface ExternalProcessesModalProps {
  open: boolean;
  handleClose: () => void;
}
export default function ExternalProcessesModal({
  open,
  handleClose,
}: ExternalProcessesModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} sx={{ minWidth: '400px' }}>
      <BaseModalHeader title={'Create new External Process'} />
      <BaseModalBody>
        <ExternalProcessCreate handleClose={handleClose} />
      </BaseModalBody>
    </BaseModal>
  );
}
