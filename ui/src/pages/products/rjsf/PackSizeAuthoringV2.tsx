import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RJSFSchema, UiSchema, withTheme } from '@rjsf/core';
import { Theme } from '@rjsf/mui';
import { Box, Button, Grid, Paper, Alert } from '@mui/material';
import WarningModal from '../../../themes/overrides/WarningModal';
import useAuthoringStore from '../../../stores/AuthoringStore';
import { useFetchBulkAuthorPackSizes } from '../../../hooks/api/tickets/useTicketProduct';
import { findWarningsForBrandPackSizes } from '../../../types/productValidationUtils';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewCreateModal from '../components/ProductPreviewCreateModal.tsx';
import { customizeValidator } from '@rjsf/validator-ajv8';
import ajvErrors from 'ajv-errors';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';

import CustomFieldTemplate from './templates/CustomFieldTemplate.tsx';
import ObjectFieldTemplate from './templates/ObjectFieldTemplate.tsx';
import PackSizeArrayTemplate from './templates/bulkBrandPack/PackSizeArrayTemplate.tsx'; // You'll need to create this if you want custom array rendering
import { BrandPackSizeCreationDetails } from '../../../types/product.ts';
import NewPackSizeInputField from './fields/bulkBrandPack/NewPackSizeInputField.tsx';
import TitleWidget from './widgets/TitleWidget.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import { useQuery } from '@tanstack/react-query';
import { ConfigService } from '../../../api/ConfigService.ts';

interface FormData {
  selectedProduct?: string;
  existingPackSizes?: any[];
  packSizes: any[];
  newPackSizeInput: {
    packSize?: number;
    externalIdentifiers: any[];
  };
}

const Form = withTheme(Theme);

export interface PackSizeAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  fieldBindings: any;
}

const validator = customizeValidator();
ajvErrors(validator.ajv);

function PackSizeAuthoringV2({
  selectedProduct,
  task,
  ticket,
  fieldBindings,
}: PackSizeAuthoringV2Props) {
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
  const [formData, setFormData] = useState<FormData>({});
  const { data, isFetching } = useFetchBulkAuthorPackSizes(
    selectedProduct,
    task.branchPath,
  );
  const formRef = useRef<any>(null);

  const widgets = {
    OneOfArrayWidget,
    TitleWidget,
  };

  const fields = {
    NewPackSizeInputField,
    AutoCompleteField,
  };

  const handleClear = useCallback(() => {
    const newData: FormData = {
      ...formData,
      newPackSizeInput: { packSize: undefined, externalIdentifiers: [] },
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
        existingPackSizes: data.packSizes || [],
        unitOfMeasure: data.unitOfMeasure,
        newPackSizeInput: { packSize: undefined, externalIdentifiers: [] },
      };
      console.log('Initial formData:', newData);
      setFormData(newData);
    }
  }, [selectedProduct, data]);

  const onSubmit = async (submittedFormData: FormData) => {
    setFormData(submittedFormData);
    setBrandPackSizePreviewDetails(undefined);
    const packSizeDetails: BrandPackSizeCreationDetails = {
      type: 'brand-pack-size',
      productId: selectedProduct?.id,
      packSizes: {
        productId: selectedProduct?.id,
        unitOfMeasure: data?.unitOfMeasure, // Assuming this comes from the fetched data
        packSizes: submittedFormData.packSizes,
      },
      externalIdentifiers: [],
    };
    setBrandPackSizePreviewDetails(packSizeDetails);
    setRunningWarningsCheck(true);

    try {
      const warnings = await findWarningsForBrandPackSizes(
        packSizeDetails,
        task.branchPath,
        fieldBindings,
      );
      if (warnings.length > 0) {
        setWarnings(warnings);
        setPreviewModalOpen(false);
        setWarningModalOpen(true);
      } else {
        previewBrandPackSize(
          packSizeDetails,
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

  const handlePreviewClick = () => {
    if (formRef.current && formData) {
      onSubmit(formData);
    }
  };
  const formContext = {
    onChange: (newFormData: FormData) => {
      setFormData(newFormData);
    },
    formData,
    handleClear,
    onSubmit: (data: { formData: FormData }) => onSubmit(data.formData),
    validator,
  };

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
        Search and select a product to create new pack size(s).
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
                Enter one or more new pack sizes for the selected product.
              </Alert>
              <Form
                ref={formRef}
                schema={schema}
                uiSchema={uiSchema}
                formData={formData}
                onChange={({ formData: newFormData }) =>
                  setFormData(newFormData as FormData)
                }
                onSubmit={({ formData }) => onSubmit(formData)}
                widgets={widgets}
                fields={fields}
                templates={{
                  FieldTemplate: CustomFieldTemplate,
                  ArrayFieldTemplate: PackSizeArrayTemplate, // Create this if needed
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
                    onClick={handlePreviewClick}
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={
                      !formContext.formData.packSizes ||
                      formContext.formData.packSizes.length === 0
                    }
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
    queryKey: ['bulk-pack-schema', branchPath],
    queryFn: () => ConfigService.fetchBulkPackSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export const useUiSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['bulk-pack-uiSchema', branchPath],
    queryFn: () => ConfigService.fetchBulkPackUiSchemaData(branchPath),
    enabled: !!branchPath,
  });
};
export default PackSizeAuthoringV2;
