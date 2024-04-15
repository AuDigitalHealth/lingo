import { Card, Modal, SxProps } from '@mui/material';
import { ReactNode } from 'react';

interface BaseModalProps {
  id?: string;
  open: boolean;
  handleClose:
    | ((event: object, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | (() => void);
  children?: ReactNode;
  sx?: SxProps;
}

export default function BaseModal({
  id,
  open,
  handleClose,
  children,
  sx,
}: BaseModalProps) {
  return (
    <Modal id={id} open={open} onClose={handleClose}>
      <Card
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '350px',
          overflow: 'auto',
          maxHeight: '95%',
          ...sx,
        }}
      >
        {children}
      </Card>
    </Modal>
  );
}
