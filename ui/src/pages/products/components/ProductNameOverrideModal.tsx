import { Button, Stack, TextField, useTheme } from '@mui/material';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import { useEffect, useState } from 'react';
import { ProductCreationDetails } from '../../../types/product';

interface ProductNameOverrideModalProps {
  open: boolean;
  productCreationDetails?: ProductCreationDetails;
  productName?: string;
  handleClose: () => void;
  ignore: () => void;
  saveProduct: () => void;
}
export function ProductNameOverrideModal({
  open,
  productCreationDetails,
  handleClose,
  productName,
  ignore,
  saveProduct,
}: ProductNameOverrideModalProps) {
  const theme = useTheme();
  const [overrideName, setOverrideName] = useState(productName);

  useEffect(() => {
    setOverrideName(productName);
  }, [productName]);

  const handleOverrideNameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setOverrideName(event.target.value);
  };

  const handleUpdateName = () => {
    if (productCreationDetails && overrideName !== undefined) {
      productCreationDetails.nameOverride = overrideName;
    }
    saveProduct();
  };

  return (
    <BaseModal open={open} handleClose={handleClose}>
      <div style={{ backgroundColor: theme.palette.warning.light }}>
        <BaseModalHeader title={'Warning!'} />
      </div>
      <BaseModalBody data-testid={'override-modal'}>
        <>
          'Choose whether to overwrite the existing saved product data, create a
          saved product name, or go back'
          <TextField
            fullWidth
            label="Updated Name"
            variant="outlined"
            value={overrideName}
            onChange={handleOverrideNameChange}
            data-testid={'override-name-input'}
          />
        </>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Stack direction="row" spacing={1}>
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={() => handleClose()}
              data-testid={'warning-and-proceed-btn'}
            >
              {'Go Back'}
            </Button>
            <Button
              color="warning"
              size="small"
              variant="contained"
              onClick={() => ignore()}
              data-testid={'warning-and-proceed-btn'}
            >
              {'Overwrite'}
            </Button>
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={handleUpdateName}
              disabled={overrideName?.trim() === productName?.trim()}
              data-testid={'update-name-btn'}
            >
              {'Update Name'}
            </Button>
          </Stack>
        }
      />
    </BaseModal>
  );
}
