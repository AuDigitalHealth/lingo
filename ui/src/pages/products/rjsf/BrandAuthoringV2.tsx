import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withTheme } from '@rjsf/core';
import { Theme } from '@rjsf/mui';
import { Box, Button, Grid, Paper, Alert } from '@mui/material';
import WarningModal from '../../../themes/overrides/WarningModal';
import useAuthoringStore from '../../../stores/AuthoringStore';
import { useFetchBulkAuthorBrands } from '../../../hooks/api/tickets/useTicketProduct';
import { findWarningsForBrandPackSizes } from '../../../types/productValidationUtils';

import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewCreateModal from '../components/ProductPreviewCreateModal.tsx';
import { customizeValidator } from '@rjsf/validator-ajv8';
import ajvErrors from 'ajv-errors';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import BrandArrayTemplate from './templates/bulkBrandPack/BrandArrayTemplate.tsx';
import CustomFieldTemplate from './templates/CustomFieldTemplate.tsx';
import NewBrandInputField from './fields/bulkBrandPack/NewBrandInputField.tsx';
import ObjectFieldTemplate from './templates/ObjectFieldTemplate.tsx';
import { BrandPackSizeCreationDetails } from '../../../types/product.ts';
import TitleWidget from './widgets/TitleWidget.tsx';
import { useQuery } from '@tanstack/react-query';
import { ConfigService } from '../../../api/ConfigService.ts';

// Define FormData interface
interface FormData {
  selectedProduct?: string;
  existingBrands?: any[];
  brands: any[];
  newBrandInput: {
    brand?: string;
    externalIdentifiers: any[];
  };
}

const Form = withTheme(Theme);

export interface BrandAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  fieldBindings: any;
}

const validator = customizeValidator();
ajvErrors(validator.ajv);

function BrandAuthoringV2({
  selectedProduct,
  task,
  ticket,
  fieldBindings,
}: BrandAuthoringV2Props) {
  const {
    productCreationDetails,
    previewModalOpen,
    setPreviewModalOpen,
    loadingPreview,
    warningModalOpen,
    setWarningModalOpen,
    previewBrandPackSize,
    handlePreviewToggleModal,
    setBrandPackSizePreviewDetails,
  } = useAuthoringStore();

  const { data: schema, isLoading: isSchemaLoading } = useSchemaQuery(
    task.branchPath,
  );
  const { data: uiSchema, isLoading: isUiSchemaLoading } = useUiSchemaQuery(
    task.branchPath,
  );

  const [runningWarningsCheck, setRunningWarningsCheck] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>();
  const { data, isFetching } = useFetchBulkAuthorBrands(
    selectedProduct,
    task.branchPath,
  );
  const formRef = useRef<any>(null);

  const widgets = {
    OneOfArrayWidget,
    TitleWidget,
  };

  const fields = {
    AutoCompleteField,
    NewBrandInputField,
  };

  const handleClear = useCallback(() => {
    const newData: FormData = {
      ...formData,
      newBrandInput: { brand: undefined, externalIdentifiers: [] },
    };
    setFormData(newData);
    if (formRef.current) {
      formRef.current.reset();
    }
  }, [formData]);

  useEffect(() => {
    if (selectedProduct && data) {
      const newData: FormData = {
        selectedProduct: selectedProduct.pt?.term || '',
        existingBrands: data.brands || [],
        newBrandInput: { brand: undefined, externalIdentifiers: [] },
      };
      console.log('Initial formData:', newData);
      setFormData(newData);
    }
  }, [selectedProduct, data]);

  const onSubmit = async ({ formData }: { formData: FormData }) => {
    setBrandPackSizePreviewDetails(undefined);
    const brandPackSizeDetails: BrandPackSizeCreationDetails = {
      type: 'brand-pack-size',
      productId: selectedProduct?.id,
      brands: { productId: selectedProduct?.id, brands: formData.brands },
      externalIdentifiers: [],
    };
    setBrandPackSizePreviewDetails(brandPackSizeDetails);
    setRunningWarningsCheck(true);
    try {
      const warnings = await findWarningsForBrandPackSizes(
        brandPackSizeDetails,
        task.branchPath,
        fieldBindings,
      );
      if (warnings.length > 0) {
        setWarnings(warnings);
        setPreviewModalOpen(false);
        setWarningModalOpen(true);
      } else {
        previewBrandPackSize(
          brandPackSizeDetails,
          ticket,
          task.branchPath,
          null,
          ticket.id,
        );
        setPreviewModalOpen(true);
      }
    } catch (error) {
      console.error('Error during submission:', error);
      setWarnings(['An error occurred while processing your request.']);
      setWarningModalOpen(true);
    } finally {
      setRunningWarningsCheck(false);
    }
  };

  const formContext = {
    onChange: (newFormData: FormData) => {
      console.log('Form context onChange:', newFormData);
      setFormData(newFormData);
    },
    formData,
    handleClear,
    onSubmit,
  };
  if (isSchemaLoading || isUiSchemaLoading) {
    return <ProductLoader message="Loading Schema" />;
  }
  if (isFetching)
    return (
      <ProductLoader
        message={`Loading Product details for ${selectedProduct?.pt?.term}`}
      />
    );
  if (loadingPreview)
    return (
      <ProductLoader
        message={`Loading Product Preview for ${selectedProduct?.pt?.term}`}
      />
    );
  if (runningWarningsCheck)
    return <ProductLoader message={`Running validation before Preview`} />;
  if (!selectedProduct || !data) {
    return (
      <Alert severity="info">
        Search and select a product to create new brand(s).
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container>
        <WarningModal
          open={warningModalOpen}
          content={warnings.join('\n')}
          handleClose={() => setWarningModalOpen(false)}
          action="Proceed"
          handleAction={() =>
            previewBrandPackSize(
              formData as any,
              ticket,
              task.branchPath,
              null,
              ticket.id,
            )
          }
        />
        <ProductPreviewCreateModal
          productType="medication"
          productCreationDetails={productCreationDetails}
          handleClose={handlePreviewToggleModal}
          open={previewModalOpen}
          branch={task.branchPath}
          ticket={ticket}
        />
        <Grid item xs={12}>
          <Paper>
            <Box m={1} p={1}>
              <Alert severity="info" sx={{ mb: 1 }}>
                Enter one or more new brands for the selected product.
              </Alert>
              <Form
                ref={formRef}
                schema={schema}
                uiSchema={uiSchema}
                formData={formData}
                onChange={({ formData: newFormData }) =>
                  setFormData(newFormData as FormData)
                }
                onSubmit={onSubmit}
                widgets={widgets}
                fields={fields}
                templates={{
                  FieldTemplate: CustomFieldTemplate,
                  ArrayFieldTemplate: BrandArrayTemplate,
                  ObjectFieldTemplate,
                }}
                validator={validator}
                formContext={formContext}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    Preview
                  </Button>
                </Box>
              </Form>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
export const useSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['bulk-brand-schema', branchPath],
    queryFn: () => ConfigService.fetchBulkBrandSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export const useUiSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['bulk-brand-uiSchema', branchPath],
    queryFn: () => ConfigService.fetchBulkBrandUiSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export default BrandAuthoringV2;
