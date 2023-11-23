import { Button } from '@mui/material';
import BaseModal from '../../components/modal/BaseModal.tsx';
import BaseModalHeader from '../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../components/modal/BaseModalFooter.tsx';
import BaseModalBody from '../../components/modal/BaseModalBody.tsx';
import { Stack } from '@mui/system';

interface ConfirmationModalProps {
  open: boolean;
  handleClose: () => void;
  content: string;
  handleAction: () => void;
  disabled: boolean;
  title: string;
  action: string;
  reverseAction?: string;
}

export default function ConfirmationModal({
  open,
  handleClose,
  content,
  handleAction,
  disabled,
  title,
  action,
  reverseAction,
}: ConfirmationModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title={title} />
      <BaseModalBody>{content}</BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Stack
            direction="row"
            spacing={1}
            // sx={{ marginLeft: '10px' }}
            // alignItems="center"
          >
            <Button
              color="error"
              size="small"
              variant="contained"
              onClick={handleAction}
              disabled={disabled}
            >
              {action}
            </Button>
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={handleClose}
              disabled={disabled}
            >
              {reverseAction ? reverseAction : 'Return to screen'}
            </Button>
          </Stack>
        }
      />
    </BaseModal>
  );
}
