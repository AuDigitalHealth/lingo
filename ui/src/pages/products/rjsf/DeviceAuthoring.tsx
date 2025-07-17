import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Form } from '@rjsf/mui';
import { Box, Button, Container, FormControlLabel, Paper, Switch } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import ajvErrors from 'ajv-errors';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import UnitValueUnWrappedField from './fields/UnitValueUnWrappedField.tsx';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewManageModal from '../components/ProductPreviewManageModal.tsx';
import CustomFieldTemplate from './templates/CustomFieldTemplate.tsx';
import CustomArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';
import NumberWidget from './widgets/NumberWidget.tsx';
import TextFieldWidget from './widgets/TextFieldWidget.tsx';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import productService from '../../../api/ProductService.ts';
import { ConfigService } from '../../../api/ConfigService.ts';
import {
  isValueSetExpansionContains
} from '../../../types/predicates/isValueSetExpansionContains.ts';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import {
  DevicePackageDetails,
  ProductActionType,
  ProductSaveDetails,
  ProductType
} from '../../../types/product.ts';

import { useTicketProductQuery } from './hooks/useTicketProductQuery.ts';
import ProductPartialSaveModal from './components/ProductPartialSaveModal.tsx';
import { DraftSubmitPanel } from './components/DarftSubmitPanel.tsx';
import MuiGridTemplate from './templates/MuiGridTemplate.tsx';
import ExternalIdentifiers from './fields/bulkBrandPack/ExternalIdentifiers.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import WarningIcon from '@mui/icons-material/Warning';

export interface DeviceAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  ticketProductId?: string;
}

const validator = customizeValidator();
ajvErrors(validator.ajv);

function DeviceAuthoring({
  task,
  selectedProduct,
  ticket,
  ticketProductId,
}: DeviceAuthoringV2Props) {
  const [formData, setFormData] = useState({});
  const [initialFormData, setInitialFormData] = useState({});
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errorSchema, setErrorSchema] = useState({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'update'>('create');
  const formRef = useRef<any>(null); // Ref to access the RJSF Form instance
  const { data: schema, isLoading: isSchemaLoading } = useSchemaQuery(
    task.branchPath,
  );
  const { data: uiSchema, isLoading: isUiSchemaLoading } = useUiSchemaQuery(
    task.branchPath,
  );
  const {
    originalConceptId,
    setOriginalConceptId,
    setProductPreviewDetails,
    setProductSaveDetails,
    productSaveDetails,
    loadingPreview,
    isProductUpdate,
    setIsProductUpdate,
    handleClearForm
  } = useAuthoringStore();

  const { isLoading, isFetching } = useProductQuery({
    selectedProduct,
    task,
    setFunction: (data: any) => {
      setFormData(data);
      setInitialFormData(data);
    },
  });
  const {
    isLoading: isTicketProductLoading,
    isFetching: isTicketProductFetching,
  } = useTicketProductQuery({
    ticketProductId,
    ticket,
    setFunction: (data: any) => {
      setMode(data.action === 'UPDATE' ? 'update' : 'create');
      setFormData(data.packageDetails);
      setInitialFormData(data.packageDetails);
      setOriginalConceptId(data.originalConceptId);
    },
  });
  const mutation = useCalculateProduct();
  const { isPending, data } = mutation;

  const handleSaveToggleModal = () => {
    setSaveModalOpen(!saveModalOpen);
  };
  const handleToggleCreateModal = useCallback(() => {
    setCreateModalOpen(!createModalOpen);
  }, [createModalOpen]);

  const handleChange = ({ formData }: any) => {
    setFormData(formData);
    if (!_.isEmpty(formData.productName)) {
      setIsDirty(true); //TODO better way to handle check form is dirty
    }
  };

  const handleFormSubmit = ({ formData }: any) => {
    mutation.mutate({
      formData,
      initialFormData,
      ticket,
      toggleModalOpen: handleToggleCreateModal,
      task,
      isProductUpdate,
      selectedProduct,
      setProductPreviewDetails,
      setProductSaveDetails,
      originalConceptId,
    });
  };
  const saveDraft = () => {
    setSaveModalOpen(true);
  };

  const handleClear = useCallback(() => {
    setFormData({});
    setInitialFormData({});
    setErrorSchema({});
    setIsDirty(false);
    if (formRef.current) {
      formRef.current.reset();
    }
    setMode(prevState => 'create');
    handleClearForm();
  }, []);

  // Clear form data when task changes
  useEffect(() => {
    handleClear();
  }, [task, handleClear]);

  if (
    isLoading ||
    isFetching ||
    isTicketProductLoading ||
    isTicketProductFetching ||
    loadingPreview
  ) {
    return <ProductLoader message="Loading Product details" />;
  }

  if (isPending) {
    return (
      <ProductLoader
        message={
          isProductUpdate
            ? 'Previewing update product'
            : 'Previewing new product'
        }
      />
    );
  }

  if (isSchemaLoading || isUiSchemaLoading) {
    return <ProductLoader message="Loading Schema" />;
  }

  const formContext = {
    onChange: (newFormData: any) => {
      setFormData(newFormData);
    },
    formData,
    uiSchema,
    errorSchema,
  };

  const onError = (errors: any) => {
    console.log('Form errors:', errors);
    const newErrorSchema = errors.reduce((acc: any, error: any) => {
      _.set(acc, error.property.slice(1), { __errors: [error.message] });
      return acc;
    }, {});
    setErrorSchema(newErrorSchema);
  };

  return (
    <Paper sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
      <Box m={2} p={2}>
        <Container>
          <Form
            ref={formRef}
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            formContext={formContext}
            onChange={handleChange}
            onSubmit={handleFormSubmit}
            onError={onError}
            fields={{
              UnitValueUnWrappedField: UnitValueUnWrappedField,
              AutoCompleteField,
              ExternalIdentifiers,
            }}
            templates={{
              FieldTemplate: CustomFieldTemplate,
              ArrayFieldTemplate: CustomArrayFieldTemplate,
              ObjectFieldTemplate: MuiGridTemplate,
            }}
            validator={validator}
            widgets={{
              NumberWidget,
              TextFieldWidget,
              OneOfArrayWidget,
            }}
            disabled={isPending}
          >
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
              }}
            >
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClear}
                disabled={isPending}
              >
                Clear
              </Button>
              <DraftSubmitPanel isDirty={isDirty} saveDraft={saveDraft} />
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mode === 'update'}
                      onChange={(_, checked) =>
                        setMode(checked ? 'update' : 'create')
                      }
                      color="primary"
                      disabled={!selectedProduct && !originalConceptId}
                    />
                  }
                  label="Update Mode"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  data-testid={mode === 'create' ? 'create-btn' : 'update-btn'}
                  type="submit"
                  variant="contained"
                  color={mode === 'create' ? 'primary' : 'warning'}
                  sx={mode === 'update' ? { color: '#000' } : {}}
                  disabled={isPending}
                  onClick={() => {
                    setIsProductUpdate(mode === 'update');
                  }}
                >
                  {isPending
                    ? 'Submitting...'
                    : mode === 'create'
                      ? 'Create New Product'
                      : 'Update Existing Product'}
                </Button>
              </Box>
            </Box>
            {mode === 'update' && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mt: 2,
                  mb: 2,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#000',
                    fontWeight: 500,
                  }}
                >
                  <WarningIcon sx={{ color: '#ed6c02', mr: 1 }} />
                  Updating existing product &nbsp;
                  <strong style={{ color: '#ed6c02' }}>
                    {selectedProduct?.pt.term}
                  </strong>
                  .
                </span>
              </Box>
            )}
          </Form>
          <ProductPartialSaveModal
            packageDetails={formData}
            originalPackageDetails={initialFormData}
            originalConceptId={selectedProduct?.id ?? originalConceptId}
            handleClose={handleSaveToggleModal}
            open={saveModalOpen}
            ticket={ticket}
            existingProductId={ticketProductId}
            actionType={mode}
          />
          <ProductPreviewManageModal
            open={createModalOpen}
            handleClose={handleToggleCreateModal}
            productCreationDetails={productSaveDetails}
            branch={task.branchPath}
            ticket={ticket}
            productType={ProductType.device}
            isProductUpdate={isProductUpdate}
          />
        </Container>
      </Box>
    </Paper>
  );
}

interface UseCalculateProductArguments {
  formData: any;
  initialFormData: any;
  ticket: Ticket;
  toggleModalOpen: () => void;
  task: Task;
  isProductUpdate: boolean;
  selectedProduct: Concept | ValueSetExpansionContains | null;
  setProductPreviewDetails: (details: DevicePackageDetails | undefined) => void;
  setProductSaveDetails: (details: ProductSaveDetails | undefined) => void;
  originalConceptId: string | undefined;
}

export function useCalculateProduct() {
  const mutation = useMutation({
    mutationFn: async ({
      formData,
      initialFormData,
      ticket,
      task,
      isProductUpdate,
      selectedProduct,
      setProductPreviewDetails,
      setProductSaveDetails,
      originalConceptId,
    }: UseCalculateProductArguments) => {
      let productSummary;
      const originalConcept = selectedProduct
        ? selectedProduct.id
        : originalConceptId;

      if (isProductUpdate) {
        productSummary = await productService.previewUpdateDeviceProduct(
          formData,
          originalConcept,
          task.branchPath,
        );
      } else {
        productSummary = await productService.previewNewDeviceProduct(
          formData,
          task.branchPath,
        );
      }

      const productSaveDetails: ProductSaveDetails = {
        type: isProductUpdate
          ? ProductActionType.update
          : ProductActionType.create,
        productSummary,
        packageDetails: formData as DevicePackageDetails,
        ticketId: ticket.id,
        partialSaveName: null,
        nameOverride: null,
        originalConceptId: originalConcept,
        originalPackageDetails: initialFormData as DevicePackageDetails,
      };

      setProductPreviewDetails(formData);
      setProductSaveDetails(productSaveDetails);

      return productSaveDetails;
    },
    onSuccess: (_, variables) => {
      variables.toggleModalOpen();
    },
  });
  return mutation;
}

export const useSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['device-schema', branchPath],
    queryFn: () => ConfigService.fetchDeviceSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export const useUiSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['device-uiSchema', branchPath],
    queryFn: () => ConfigService.fetchDeviceUiSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

interface ProductQueryProps {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  setFunction?: ({}) => void;
}

const fetchProductDataFn = async ({
  selectedProduct,
  task,
}: ProductQueryProps) => {
  if (!selectedProduct) return null;
  const productId = isValueSetExpansionContains(selectedProduct)
    ? selectedProduct.code
    : selectedProduct.conceptId;

  return await productService.fetchDevice(productId || '', task.branchPath);
};

export const useProductQuery = ({
  selectedProduct,
  task,
  setFunction,
}: ProductQueryProps) => {
  const productId = isValueSetExpansionContains(selectedProduct)
    ? selectedProduct.code
    : selectedProduct?.conceptId;
  const queryKey = ['product', productId, task?.branchPath];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const data = await fetchProductDataFn({ selectedProduct, task });
      if (setFunction && data) setFunction(data);
      return data;
    },
    enabled: !!selectedProduct && !!task?.branchPath,
  });
};

export default DeviceAuthoring;
