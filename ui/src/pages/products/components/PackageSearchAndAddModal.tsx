import React, { useState } from 'react';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { Button } from '@mui/material';
import SearchProduct from './SearchProduct.tsx';
import { Concept } from '../../../types/concept.ts';
import ConceptService from '../../../api/ConceptService.ts';
import {
  MedicationPackageDetails,
  MedicationPackageQuantity,
} from '../../../types/authoring.ts';
import { ECL_EXCLUDE_PACKAGES } from '../../../utils/helpers/EclUtils.ts';
import { useSnackbar } from 'notistack';
import { UseFieldArrayAppend } from 'react-hook-form';

interface PackageSearchAndAddModalProps {
  open: boolean;
  handleClose: () => void;
  packageAppend: UseFieldArrayAppend<
    MedicationPackageDetails,
    'containedPackages'
  >;
  defaultUnit: Concept;
}
export default function PackageSearchAndAddModal({
  open,
  handleClose,
  packageAppend,
  defaultUnit,
}: PackageSearchAndAddModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Concept | null>(null);
  const handleSelectedProductChange = (concept: Concept | null) => {
    setSelectedProduct(concept);
  };
  const { enqueueSnackbar } = useSnackbar();
  const [searchInputValue, setSearchInputValue] = useState('');

  const handleSubmit = () => {
    if (selectedProduct && selectedProduct.conceptId) {
      void (async () => {
        try {
          const packageDetails = await ConceptService.fetchMedication(
            selectedProduct.conceptId as string,
          );
          // packageDetails.containedProducts.map(p => arrayHelpers.push(p));

          const medicationPackageQty: MedicationPackageQuantity = {
            packageDetails: packageDetails,
            unit: defaultUnit,
          };
          packageAppend(medicationPackageQty);
          handleClose();
        } catch (error) {
          handleClose();
          enqueueSnackbar(
            `Unable to retrieve the details for [${selectedProduct.pt.term}-${selectedProduct.conceptId}]`,
            {
              variant: 'error',
            },
          );
        }
      })();
    }
  };
  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Add an existing Package" />
      <BaseModalBody>
        <SearchProduct
          disableLinkOpen={true}
          handleChange={handleSelectedProductChange}
          providedEcl={ECL_EXCLUDE_PACKAGES}
          inputValue={searchInputValue}
          setInputValue={setSearchInputValue}
          showDeviceSearch={false}
        />
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedProduct}
          >
            Add Package
          </Button>
        }
      />
    </BaseModal>
  );
}
