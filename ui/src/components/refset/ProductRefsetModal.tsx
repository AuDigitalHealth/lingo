import { Button } from '@mui/material';
import BaseModal from '../modal/BaseModal';
import BaseModalBody from '../modal/BaseModalBody';
import BaseModalFooter from '../modal/BaseModalFooter';
import BaseModalHeader from '../modal/BaseModalHeader';
import ProductRefsetList from './ProductRefsetList.tsx';
import { RefsetMember } from '../../types/RefsetMember.ts';

interface ProductRefsetModalProps {
  open: boolean;
  handleClose: () => void;
  refsetMembers: RefsetMember[];
  keepMounted: boolean;
}

export default function ProductRefsetModal({
  open,
  handleClose,
  keepMounted,
  refsetMembers,
}: ProductRefsetModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} keepMounted={keepMounted}>
      <BaseModalHeader title={'Refset Members Preview'} />
      <BaseModalBody sx={{ overflow: 'auto' }}>
        {refsetMembers.length > 0 && (
          <ProductRefsetList refsetMembers={refsetMembers} />
        )}
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button variant="contained" onClick={() => handleClose()}>
            Close
          </Button>
        }
      />
    </BaseModal>
  );
}
