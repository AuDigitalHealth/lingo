import { Button } from '@mui/material';
import BaseModal from '../../../../../components/modal/BaseModal';
import BaseModalBody from '../../../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../../../components/modal/BaseModalFooter';
import BaseModalHeader from '../../../../../components/modal/BaseModalHeader';

interface DeleteConfirmationModalProps {
  open: boolean;
  handleClose: () => void;
  content: string;
  handleDelete: () => void;
  disabled: boolean;
}

export default function DeleteConfirmationModal({
  open,
  handleClose,
  content,
  handleDelete,
  disabled,
}: DeleteConfirmationModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Confirm Delete" />
      <BaseModalBody>Confirm delete for {content}?</BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button
            color="error"
            size="small"
            variant="contained"
            onClick={handleDelete}
            disabled={disabled}
          >
            Delete
          </Button>
        }
      />
    </BaseModal>
  );
}
