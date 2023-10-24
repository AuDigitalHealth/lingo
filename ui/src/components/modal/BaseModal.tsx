import { CSSObject, Card, Modal } from '@mui/material';
import { ReactNode } from 'react';

interface BaseModalProps {
  open: boolean;
  handleClose: () => void;
  children?: ReactNode;
  sx?: CSSObject;
}

const defaultStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
};

export default function BaseModal({
  open,
  handleClose,
  children,
  sx,
}: BaseModalProps) {
  return (
    <Modal open={open} onClose={handleClose}>
      <Card
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          ...sx,
        }}
      >
        {children}
      </Card>
    </Modal>
  );
}
