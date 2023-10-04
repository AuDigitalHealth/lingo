import { Box, Card, Modal } from '@mui/material';
import { ReactNode } from 'react';

interface BaseModalProps {
  open: boolean;
  handleClose: () => void;
  children?: ReactNode;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
};

export default function BaseModal({
  open,
  handleClose,
  children,
}: BaseModalProps) {
  return (
    <Modal open={open} onClose={handleClose}>
      <Card sx={style}>{children}</Card>
    </Modal>
  );
}
