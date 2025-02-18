import { Card, Modal, SxProps } from '@mui/material';
import { ReactNode } from 'react';

interface BaseModalProps {
  id?: string;
  open: boolean;
  handleClose?:
    | ((event: object, reason: 'backdropClick' | 'escapeKeyDown') => void)
    | (() => void);
  children?: ReactNode;
  sx?: SxProps;
  keepMounted?: boolean;
}

export default function BaseModal({
  id,
  open,
  handleClose,
  children,
  sx,
  keepMounted,
}: BaseModalProps) {
  return (
    <Modal
      id={id}
      open={open}
      onClose={handleClose}
      keepMounted={keepMounted ? keepMounted : false}
      disableEnforceFocus
      className="test-test-test-test"
    >
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
