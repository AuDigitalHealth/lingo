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
  DeviceProductQuantity,
  MedicationProductQuantity,
  ProductType,
} from '../../../types/product.ts';
import { generateEclFromBinding } from '../../../utils/helpers/EclUtils.ts';
import { useSnackbar } from 'notistack';
import { UseFieldArrayAppend } from 'react-hook-form';
import { isDeviceType } from '../../../utils/helpers/conceptUtils.ts';
import { FieldBindings } from '../../../types/FieldBindings.ts';
import ProductLoader from './ProductLoader.tsx';

interface ProductSearchAndAddModalProps {
  open: boolean;
  handleClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productAppend: UseFieldArrayAppend<any, 'containedProducts'>;
  productType: ProductType;
  branch: string;
  fieldBindings: FieldBindings;
  defaultUnit: Concept;
}
export default function ProductSearchAndAddModal({
  open,
  handleClose,
  productAppend,
  productType,
  branch,
  fieldBindings,
  defaultUnit,
}: ProductSearchAndAddModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Concept | null>(null);
  const handleSelectedProductChange = (concept: Concept | null) => {
    setSelectedProduct(concept);
  };
  const { enqueueSnackbar } = useSnackbar();
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isButtonDisabled = () => {
    if (selectedProduct && selectedProduct.conceptId && !isLoading) {
      return false;
    }
    return true;
  };
  const handleSubmit = () => {
    if (isDeviceType(productType)) {
      return handleDeviceSubmit();
    }
    if (selectedProduct && selectedProduct.conceptId) {
      void (async () => {
        try {
          setIsLoading(true);
          const productDetails = await ConceptService.fetchMedicationProduct(
            selectedProduct.conceptId as string,
            branch,
          );
          // packageDetails.containedProducts.map(p => arrayHelpers.push(p));

          const productQuantity: MedicationProductQuantity = {
            productDetails: productDetails,
            value: 1,
            unit: defaultUnit,
          };
          productAppend(productQuantity);
          handleClose();
        } catch (error) {
          handleClose();
          enqueueSnackbar(
            `Unable to retrieve the details for [${selectedProduct.pt?.term}-${selectedProduct.conceptId}]`,
            {
              variant: 'error',
            },
          );
        } finally {
          setIsLoading(false);
        }
      })();
    }
  };
  const handleDeviceSubmit = () => {
    if (selectedProduct && selectedProduct.conceptId) {
      void (async () => {
        try {
          setIsLoading(true);
          const productDetails = await ConceptService.fetchDeviceProduct(
            selectedProduct.conceptId as string,
            branch,
          );
          const productQuantity: DeviceProductQuantity = {
            productDetails: productDetails,
            value: 1,
            unit: defaultUnit,
          };
          productAppend(productQuantity);
          handleClose();
        } catch (error) {
          handleClose();
          enqueueSnackbar(
            `Unable to retrieve the details for [${selectedProduct.pt?.term}-${selectedProduct.conceptId}]`,
            {
              variant: 'error',
            },
          );
        } finally {
          setIsLoading(false);
        }
      })();
    }
  };

  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title="Add an existing Product" />
      <BaseModalBody>
        {isLoading ? (
          <ProductLoader
            message={`Adding product ${selectedProduct?.pt?.term} to the package`}
            marginTop={'0'}
          />
        ) : (
          <>
            <SearchProduct
              disableLinkOpen={true}
              handleChange={handleSelectedProductChange}
              providedEcl={generateEclFromBinding(
                fieldBindings,
                isDeviceType(productType)
                  ? 'deviceProduct.add.productName'
                  : 'medicationProduct.add.productName',
              )}
              inputValue={searchInputValue}
              setInputValue={setSearchInputValue}
              showDeviceSearch={false}
              branch={branch}
              fieldBindings={fieldBindings}
              hideAdvancedSearch={true}
            />
          </>
        )}
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button
            color="primary"
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={isButtonDisabled()}
          >
            Add Product
          </Button>
        }
      />
    </BaseModal>
  );
}
