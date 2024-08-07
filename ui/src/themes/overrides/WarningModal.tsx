import { Button, useTheme } from '@mui/material';
import BaseModal from '../../components/modal/BaseModal.tsx';
import BaseModalHeader from '../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../components/modal/BaseModalFooter.tsx';
import BaseModalBody from '../../components/modal/BaseModalBody.tsx';
import { Stack } from '@mui/system';

interface WarningModalProps {
  open: boolean;
  handleClose: () => void;
  content: string;
  handleAction: () => void;
  disabled?: boolean;
  action: string;
  reverseAction?: string;
}

export default function WarningModal({
  open,
  handleClose,
  content,
  handleAction,
  disabled,
  action,
  reverseAction,
}: WarningModalProps) {
  const theme = useTheme();
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <div style={{ backgroundColor: theme.palette.warning.light }}>
        <BaseModalHeader title={'Warning!'} />
      </div>
      <BaseModalBody data-testid={'warning-modal'}>{content}</BaseModalBody>
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
              onClick={() => handleAction()}
              disabled={disabled}
              data-testid={'warning-and-proceed-btn'}
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
