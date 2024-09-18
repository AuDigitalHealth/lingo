import { ReactNode } from 'react';
import { Button, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../../components/modal/BaseModalFooter.tsx';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmDisabled?: boolean;
  isActionLoading: boolean;
  onConfirm: () => void;
  handleClose: () => void;
  confirmButtonTitle?: string;
  confirmButtonColor?: 'primary' | 'error';
}
export default function ConfirmModal({
  open,
  title,
  body,
  confirmDisabled,
  isActionLoading,
  onConfirm,
  handleClose,
  confirmButtonTitle = 'Confirm',
  confirmButtonColor = 'primary',
}: ConfirmModalProps) {
  return (
    <>
      <BaseModal
        open={open}
        handleClose={!isActionLoading ? handleClose : undefined}
        sx={{ minWidth: '400px' }}
      >
        <BaseModalHeader title={title} />
        <BaseModalBody>{body}</BaseModalBody>
        <BaseModalFooter
          startChildren={<></>}
          endChildren={
            <Stack direction="row" spacing={1}>
              <LoadingButton
                variant="contained"
                loading={isActionLoading}
                disabled={confirmDisabled}
                onClick={() => onConfirm()}
                color={confirmButtonColor}
                sx={{ color: '#fff' }}
              >
                {confirmButtonTitle}
              </LoadingButton>
              <Button
                variant="contained"
                onClick={handleClose}
                disabled={isActionLoading}
                color={confirmButtonColor === 'primary' ? 'error' : 'primary'}
              >
                Cancel
              </Button>
            </Stack>
          }
        />
      </BaseModal>
    </>
  );
}
