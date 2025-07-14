import { Button, useTheme } from '@mui/material';
import BaseModal from '../../components/modal/BaseModal.tsx';
import BaseModalHeader from '../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../components/modal/BaseModalFooter.tsx';
import BaseModalBody from '../../components/modal/BaseModalBody.tsx';
import { Stack } from '@mui/system';

interface ErrorModalProps {
  open: boolean;
  handleClose?: () => void;
  content: React.ReactNode;
  disabled?: boolean;
}

export default function ErrorModal({
  open,
  handleClose,
  content,
  disabled,
}: ErrorModalProps) {
  const theme = useTheme();
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <div style={{ backgroundColor: theme.palette.error.light }}>
        <BaseModalHeader title={'Error!'} />
      </div>
      <BaseModalBody data-testid={'error-modal'}>{content}</BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Stack direction="row" spacing={1}>
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={handleClose}
              disabled={disabled}
              data-testid={'close-btn'}
            >
              {'Return to screen'}
            </Button>
          </Stack>
        }
      />
    </BaseModal>
  );
}
