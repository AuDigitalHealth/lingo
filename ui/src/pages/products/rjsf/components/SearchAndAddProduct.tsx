// components/SearchAndAddProduct.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import EclAutocomplete from './EclAutocomplete';
import { ConceptMini } from '../../../../types/concept.ts';
import { ProductAddDetails } from '../../../../types/product.ts';
import productService from '../../../../api/ProductService.ts';
import useTaskById from '../../../../hooks/useTaskById.tsx';
import { RJSFSchema } from '@rjsf/utils';
import ProductService from '../../../../api/ProductService.ts'; // Adjust path as needed

const modalStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  backgroundColor: 'white',
  border: '1px solid #ccc',
  borderRadius: '4px',
  boxShadow: '24px',
  padding: '16px',
};

interface SearchAndAddProductProps {
  open: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductAddDetails) => void;
  uiSchema: UiSchema<any, RJSFSchema, any>;
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
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" gutterBottom>
          Add Product
        </Typography>
        <EclAutocomplete
          value={selectedProduct}
          onChange={(conceptMini: ConceptMini | null) =>
            setSelectedProduct(conceptMini)
          }
          ecl={ecl}
          branch={task?.branchPath}
          showDefaultOptions={false}
          isDisabled={false}
          title={`Search and Add ${isPackage ? 'Package' : 'Product'}`}
          errorMessage={error}
        />
        {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
        {productDetails && !loading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Product Name:</strong>{' '}
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
        <Button
          variant="contained"
          color="primary"
          onClick={handleAdd}
          disabled={!productDetails || loading}
          sx={{ mt: 2 }}
        >
          Add
        </Button>
      </Box>
    </Modal>
  );
};

export default SearchAndAddProduct;
