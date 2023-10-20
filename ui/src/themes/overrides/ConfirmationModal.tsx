import { Button } from '@mui/material';
import BaseModal from '../../components/modal/BaseModal.tsx';
import BaseModalHeader from '../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../components/modal/BaseModalFooter.tsx';
import BaseModalBody from '../../components/modal/BaseModalBody.tsx';

interface ConfirmationModalProps {
  open: boolean;
  handleClose: () => void;
  content: string;
  handleAction: () => void;
  disabled: boolean;
  title: string;
  action: string;
}

export default function ConfirmationModal({
  open,
  handleClose,
  content,
  handleAction,
  disabled,
  title,
  action,
}: ConfirmationModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title={title} />
      <BaseModalBody>{content}</BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button
            color="error"
            size="small"
            variant="contained"
            onClick={handleAction}
            disabled={disabled}
          >
            {action}
          </Button>
        }
      />
    </BaseModal>
  );
}
