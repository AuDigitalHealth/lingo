import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Form } from '@rjsf/mui';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Paper,
  Switch,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import AutoCompleteField from './fields/AutoCompleteField.tsx';

import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewManageModal from '../components/ProductPreviewManageModal.tsx';
import CustomArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';

import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import productService from '../../../api/ProductService.ts';
import { ConfigService } from '../../../api/ConfigService.ts';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { validator } from './helpers/validator.ts';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { ProductAction, Ticket } from '../../../types/tickets/ticket.ts';
import {
  DevicePackageDetails,
  ProductActionType,
  ProductSaveDetails,
  ProductType,
} from '../../../types/product.ts';

import { useTicketProductQuery } from './hooks/useTicketProductQuery.ts';
import ProductPartialSaveModal from './components/ProductPartialSaveModal.tsx';
import { DraftSubmitPanel } from './components/DarftSubmitPanel.tsx';
import MuiGridTemplate from './templates/MuiGridTemplate.tsx';
import ExternalIdentifiers from './fields/bulkBrandPack/ExternalIdentifiers.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import WarningIcon from '@mui/icons-material/Warning';
import CustomTextFieldWidget from './widgets/CustomTextFieldWidget.tsx';
import {
  buildErrorSchema,
  resetDiscriminators,
} from './helpers/validationHelper.ts';
import { ErrorDisplay } from './components/ErrorDisplay.tsx';
import UnableToEditTooltip from '../../tasks/components/UnableToEditTooltip.tsx';

export interface DeviceAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  ticketProductId?: string;
}

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
  const [formErrors, setFormErrors] = useState<any[]>([]);
  const [staleModeOn, setStaleModeOn] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [partialUpdateMode, setPartialUpdateMode] = useState(false);

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
    handleClearForm,
  } = useAuthoringStore();

  const { isLoading, isFetching, refetchWithParam } = useProductQuery({
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
      setMode(
        data.action === 'UPDATE' && data.originalConceptId
          ? 'update'
          : 'create',
      );
      if (data.action === 'UPDATE' && data.originalConceptId) {
        setPartialUpdateMode(true);
      } else {
        setPartialUpdateMode(false);
      }
      setFormData(data.packageDetails);
      setInitialFormData(data.packageDetails);
      setOriginalConceptId(
        data.originalConceptId ? data.originalConceptId : data.conceptId,
      );
      if (data.originalConceptId || data.conceptId) {
        setStaleModeOn(true);
      }
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
    const updatedFormData = resetDiscriminators(schema, formData, uiSchema);
    setFormData(updatedFormData);
    if (
      !_.isEmpty(
        updatedFormData.productName || updatedFormData.containedProducts,
      )
    ) {
      setIsDirty(true);
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
      ticketProductId: ticketProductId ? Number(ticketProductId) : null,
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
    setOriginalConceptId(undefined);
  }, []);

  useEffect(() => {
    handleClear();
  }, [handleClear]);

  if (
    isLoading ||
    manualLoading ||
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
    const newErrorSchema = buildErrorSchema(errors);
    setErrorSchema(newErrorSchema);
    setFormErrors(errors);
  };

  return (
    <Paper sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
      <Box m={2} p={2}>
        <Container>
          {staleModeOn && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={async () => {
                    if (originalConceptId) {
                      setManualLoading(true);
                      try {
                        await refetchWithParam({
                          conceptId: originalConceptId,
                        });
                        setStaleModeOn(false);
                      } finally {
                        setManualLoading(false);
                      }
                    }
                  }}
                >
                  Reload
                </Button>
              }
            >
              Data loaded from the author’s saved action - useful for review but
              may be stale. Reload from terminology for the latest data to
              perform a product update.
            </Alert>
          )}
          <ErrorDisplay errors={formErrors} />
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
              AutoCompleteField,
              ExternalIdentifiers,
            }}
            templates={{
              ArrayFieldTemplate: CustomArrayFieldTemplate,
              ObjectFieldTemplate: MuiGridTemplate,
            }}
            validator={{
              ...validator,
              validateFormData: (formData, schema) =>
                validator.validateFormData(formData, schema, uiSchema),
            }}
            widgets={{
              OneOfArrayWidget,
              TextWidget: CustomTextFieldWidget,
            }}
            disabled={isPending}
            noHtml5Validate={true}
            showErrorList={false}
            omitExtraData={true}
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
                <UnableToEditTooltip
                  canEdit={!(!selectedProduct && !originalConceptId)}
                  lockDescription={
                    'Update disabled: product is partially saved or the form was opened without an existing product.'
                  }
                >
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
                </UnableToEditTooltip>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <UnableToEditTooltip
                  canEdit={
                    !(
                      mutation.isPending ||
                      (mode === 'update' &&
                        ((staleModeOn && !partialUpdateMode) ||
                          (!selectedProduct && !originalConceptId)))
                    )
                  }
                  lockDescription={
                    mode === 'update'
                      ? staleModeOn && !partialUpdateMode
                        ? 'Update disabled to prevent stale data. Please click reload to get the latest before updating.'
                        : 'Update disabled: product is partially saved or the form was opened without an existing product.'
                      : 'Submitting ...'
                  }
                >
                  <Button
                    data-testid={
                      mode === 'create' ? 'create-btn' : 'update-btn'
                    }
                    type="submit"
                    variant="contained"
                    color={mode === 'create' ? 'primary' : 'warning'}
                    sx={mode === 'update' ? { color: '#000' } : {}}
                    disabled={
                      mutation.isPending ||
                      (mode === 'update' &&
                        ((staleModeOn && !partialUpdateMode) ||
                          (!selectedProduct && !originalConceptId)))
                    }
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
                </UnableToEditTooltip>
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
            actionType={
              mode === 'update' ? ProductAction.UPDATE : ProductAction.CREATE
            }
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
  ticketProductId?: number | null;
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
      ticketProductId,
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
        ticketProductId: ticketProductId || null,
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
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await fetchProductDataFn({ selectedProduct, task });
      if (setFunction && data) setFunction(data);
      return data;
    },
    enabled: !!selectedProduct && !!task?.branchPath,
  });
  const refetchWithParam = async (
    newProduct: Concept | ValueSetExpansionContains,
  ) => {
    const data = await fetchProductDataFn({
      selectedProduct: newProduct,
      task,
    });
    if (setFunction && data) setFunction(data);
    return data;
  };

  return { ...query, refetchWithParam };
};

export default DeviceAuthoring;
