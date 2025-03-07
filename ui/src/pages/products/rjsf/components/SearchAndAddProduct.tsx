import React, { useState, useEffect } from 'react';

import { Button, Box, Typography, CircularProgress } from '@mui/material';
import EclAutocomplete from './EclAutocomplete';
import { ConceptMini } from '../../../../types/concept.ts';
import { ProductAddDetails } from '../../../../types/product.ts';
import productService from '../../../../api/ProductService.ts';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import ProductService from '../../../../api/ProductService.ts';
import BaseModalFooter from '../../../../components/modal/BaseModalFooter.tsx';
import BaseModal from '../../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../../components/modal/BaseModalHeader.tsx';

interface SearchAndAddProductProps {
  open: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductAddDetails) => void;
  uiSchema: any;
}

const SearchAndAddProduct: React.FC<SearchAndAddProductProps> = ({
  open,
  onClose,
  onAddProduct,
  uiSchema,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ConceptMini | null>(
    null,
  );
  const [productDetails, setProductDetails] =
    useState<ProductAddDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const task = useTaskById();
  const ecl = uiSchema?.['ui:options']?.searchAndAddProduct.ecl;
  const isPackage = uiSchema?.['ui:options']?.searchAndAddProduct.package;
  const type = uiSchema?.['ui:options']?.searchAndAddProduct.type;
  const productTitle = isPackage ? 'Package' : 'Product';

  // Fetch product details when a product is selected
  useEffect(() => {
    const getDetails = async () => {
      if (selectedProduct) {
        setLoading(true);
        setError('');
        try {
          let productDetails;

          if (type === 'device') {
            productDetails = await productService.fetchDeviceProduct(
              selectedProduct.conceptId as string,
              task?.branchPath as string,
            );
          } else if (type === 'medication') {
            if (isPackage) {
              productDetails = await ProductService.fetchMedication(
                selectedProduct.conceptId as string,
                task?.branchPath as string,
              );
            } else {
              productDetails = await productService.fetchMedicationProduct(
                selectedProduct.conceptId as string,
                task?.branchPath as string,
              );
            }
          }

          setProductDetails(productDetails);
        } catch (err) {
          setError('Failed to fetch product details');
          setProductDetails(null);
        } finally {
          setLoading(false);
        }
      } else {
        setProductDetails(null);
      }
    };

    getDetails();
  }, [selectedProduct, type, task?.branchPath]);

  // Handle adding the product
  const handleAdd = () => {
    if (productDetails) {
      onAddProduct(productDetails);
      handleClose();
    }
  };

  // Reset and close the modal
  const handleClose = () => {
    setSelectedProduct(null);
    setProductDetails(null);
    setError('');
    onClose();
  };

  return (
    <BaseModal open={open} handleClose={handleClose}>
      <BaseModalHeader title={`Add ${productTitle}`} />
      <BaseModalBody sx={{ width: '600px' }}>
        <Box width={500}>
          {task?.branchPath && (
            <EclAutocomplete
              value={selectedProduct}
              onChange={(conceptMini: ConceptMini | null) =>
                setSelectedProduct(conceptMini)
              }
              ecl={ecl}
              branch={task?.branchPath}
              showDefaultOptions={false}
              isDisabled={false}
              title={`Search and Add ${productTitle}`}
              errorMessage={error}
            />
          )}

          {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
          {productDetails && !loading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{`${productTitle} Name:`}</strong>{' '}
                {productDetails.productName?.pt?.term}
              </Typography>
              <Typography variant="body2">
                <strong>ConceptId:</strong>{' '}
                {productDetails.productName?.conceptId}
              </Typography>
            </Box>
          )}
          {error && !loading && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAdd}
              disabled={!productDetails || loading}
              size="small"
            >
              Add
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        }
      />
    </BaseModal>
  );
};

export default SearchAndAddProduct;
