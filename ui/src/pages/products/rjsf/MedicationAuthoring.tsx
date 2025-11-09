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
import ConditionalArrayField from './fields/ConditionalArrayField.tsx';

import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewManageModal from '../components/ProductPreviewManageModal.tsx';
import CustomArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';

import ExternalIdentifiers from './fields/bulkBrandPack/ExternalIdentifiers.tsx';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import productService from '../../../api/ProductService.ts';
import { ConfigService } from '../../../api/ConfigService.ts';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import {
  ProductAction,
  Ticket,
  TicketProductAuditDto,
} from '../../../types/tickets/ticket.ts';
import {
  MedicationPackageDetails,
  ProductActionType,
  ProductSaveDetails,
  ProductType,
} from '../../../types/product.ts';
import { useTicketProductQuery } from './hooks/useTicketProductQuery.ts';
import { DraftSubmitPanel } from './components/DarftSubmitPanel.tsx';
import ProductPartialSaveModal from './components/ProductPartialSaveModal.tsx';
import MuiGridTemplate from './templates/MuiGridTemplate.tsx';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { validator } from './helpers/validator.ts';
import {
  buildErrorSchema,
  resetDiscriminators,
} from './helpers/validationHelper.ts';
import { ErrorDisplay } from './components/ErrorDisplay.tsx';
import CustomSelectWidget from './widgets/CustomSelectWidget.tsx';
import { evaluateExpression } from './helpers/rjsfUtils.ts';
import WarningIcon from '@mui/icons-material/Warning';
import CustomTextFieldWidget from './widgets/CustomTextFieldWidget.tsx';
import UnableToEditTooltip from '../../tasks/components/UnableToEditTooltip.tsx';
import { showError } from '../../../types/ErrorHandler.ts';
import { useActiveConceptIdsByIds } from '../../../hooks/eclRefset/useConceptsById.tsx';
import { isOriginalConceptActive } from '../../../utils/helpers/conceptUtils.ts';
import useCanEditTask from '../../../hooks/useCanEditTask.tsx';

export interface MedicationAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  ticketProductId?: string;
  productAuditDto?: TicketProductAuditDto;
}

function MedicationAuthoring({
  task,
  selectedProduct,
  ticketProductId,
  ticket,
  productAuditDto,
}: MedicationAuthoringV2Props) {
  const [formKey, setFormKey] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [initialFormData, setInitialFormData] = useState<any>({});
  const [snowStormFormData, setSnowStormFormData] = useState<any>({});
  const [errorSchema, setErrorSchema] = useState<any>({});
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const formRef = useRef<any>(null);

  const [isDirty, setIsDirty] = useState(false);
  const [formErrors, setFormErrors] = useState<any[]>([]);
  const [staleModeOn, setStaleModeOn] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [partialUpdateMode, setPartialUpdateMode] = useState(false);
  const { canEdit, lockDescription } = useCanEditTask();
  const existingConceptToLoad = selectedProduct
    ? isValueSetExpansionContains(selectedProduct)
      ? selectedProduct.code
      : selectedProduct.conceptId
    : undefined;

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
    setSelectedConceptIdentifiers,
    mode,
    setMode,
  } = useAuthoringStore();

  const { isLoading, isFetching, refetchWithParam } = useProductQuery({
    productId: existingConceptToLoad,
    task,
    setFunction: (data: any) => {
      setFormData(data);
      setInitialFormData(data);
      setFormErrors([]);
    },
  });
  const {
    isLoading: originalConceptIsLoading,
    isFetching: originalConceptIsFetching,
  } = useProductQuery({
    productId: originalConceptId ? originalConceptId : existingConceptToLoad,
    task,
    setFunction: (data: any) => {
      setSnowStormFormData(data);
    },
    disabled: mode != 'update',
  });
  const {
    isLoading: isTicketProductLoading,
    isFetching: isTicketProductFetching,
  } = useTicketProductQuery({
    ticketProductId,
    productAuditDto,
    ticket,
    setFunction: (data: any) => {
      setMode(
        data.action === 'UPDATE' && data.originalConceptId
          ? 'update'
          : 'create',
      );
      if (
        data.action === 'UPDATE' &&
        data.originalConceptId &&
        !data.conceptId
      ) {
        setPartialUpdateMode(true);
      } else {
        setPartialUpdateMode(false);
      }
      setFormData(data.packageDetails);
      setInitialFormData(data.packageDetails);
      setOriginalConceptId(
        data.originalConceptId ? data.originalConceptId : data.conceptId,
      ); //fallback to conceptId for newly created product where originalConceptId is null
      if (data.originalConceptId || data.conceptId) {
        setStaleModeOn(true);
      }
    },
  });
  const mutation = useCalculateProduct();

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

  const handleSaveToggleModal = () => {
    setSaveModalOpen(!saveModalOpen);
  };

  const handleFormSubmit = ({ formData }: { formData: any }) => {
    setSelectedConceptIdentifiers([]);
    const validation = validator.validateFormData(formData, schema, uiSchema);
    setFormErrors(validation.errors);
    setFormData(formData);
    mutation.mutate({
      formData: formData,
      initialformData: initialFormData,
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

  const handleClear = useCallback(() => {
    setFormData({});
    setErrorSchema({});
    setFormErrors([]);
    setIsDirty(false);
    setFormKey(prev => prev + 1);
    setMode('create');
    handleClearForm();
    setOriginalConceptId(undefined);
    setSelectedConceptIdentifiers([]);
  }, []);
  const { activeConceptIds, activeConceptsLoading } = useActiveConceptIdsByIds(
    task.branchPath,
    originalConceptId ? [originalConceptId] : [],
  );

  const isProductUpdateDisabled = () => {
    if (mode === 'update') {
      if (!selectedProduct && !originalConceptId) {
        return true;
      } else if (
        originalConceptId &&
        !isOriginalConceptActive(originalConceptId, activeConceptIds)
      ) {
        return true;
      }
    }
    return false;
  };
  const getLockDescription = () => {
    if (!canEdit) {
      return lockDescription;
    }

    if (mode === 'update') {
      if (staleModeOn && !partialUpdateMode) {
        return 'Update disabled to prevent stale data. Please click reload to get the latest before updating.';
      }
      return 'Update disabled: product is partially saved or the form was opened without an existing product.';
    }

    return 'Submitting ...';
  };
  // Clear form data when schemaType changes
  useEffect(() => {
    handleClear();
  }, [handleClear]);

  if (
    isLoading ||
    manualLoading ||
    isFetching ||
    isTicketProductLoading ||
    loadingPreview ||
    isTicketProductFetching ||
    isSchemaLoading ||
    isUiSchemaLoading
  ) {
    return <ProductLoader message="Loading Product details or Schema" />;
  }

  if (mutation.isPending) {
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

  const formContext = {
    onChange: (newFormData: any) => {
      setFormData(newFormData);
    },
    formData,
    uiSchema,
    schema,
    errorSchema,
    autoFillDefaults: true,
    evaluateExpression,
    snowStormFormData,
    mode,
  };

  const saveDraft = () => {
    setSaveModalOpen(true);
  };

  const onError = (errors: any) => {
    const newErrorSchema = buildErrorSchema(errors);
    setErrorSchema(newErrorSchema);
    setFormErrors(errors);
  };

  return (
    <Paper sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
      <Box m={2} p={2}>
        <Container data-testid="product-creation-grid">
          {staleModeOn &&
            isOriginalConceptActive(originalConceptId, activeConceptIds) && (
              <Alert
                severity="warning"
                variant="outlined"
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
                          await refetchWithParam(originalConceptId);
                          setStaleModeOn(false);
                        } catch (error) {
                          showError(error.message);
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
                Data loaded from the author’s saved action - useful for review
                but may be stale. Reload from terminology for the latest data to
                perform a product update.
              </Alert>
            )}

          {staleModeOn &&
            !isOriginalConceptActive(originalConceptId, activeConceptIds) && (
              <Alert
                severity="warning"
                variant="outlined"
                sx={{
                  mb: 2,
                }}
              >
                Data loaded from the author’s saved action — useful for review,
                but it may be outdated. Reload option is unavailable because the
                original concept could not be found or is inactive; therefore,
                the update action has been disabled.
              </Alert>
            )}

          {/* Custom Error Modal */}
          <ErrorDisplay errors={formErrors} />
          <Form
            key={formKey}
            ref={formRef}
            schema={schema as any}
            uiSchema={uiSchema as any}
            formData={formData}
            formContext={formContext}
            fields={{
              AutoCompleteField,
              ConditionalArrayField,
              ExternalIdentifiers,
            }}
            widgets={{
              TextWidget: CustomTextFieldWidget,
              OneOfArrayWidget,
              SelectWidget: CustomSelectWidget,
            }}
            templates={{
              ArrayFieldTemplate: CustomArrayFieldTemplate,
              ObjectFieldTemplate: MuiGridTemplate,
            }}
            onChange={handleChange}
            onSubmit={handleFormSubmit}
            onError={onError}
            validator={{
              ...validator,
              validateFormData: (formData, schema) =>
                validator.validateFormData(formData, schema, uiSchema),
            }}
            disabled={mutation.isPending}
            noHtml5Validate={true}
            noValidate={false}
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
                data-testid={'product-clear-btn'}
                variant="outlined"
                color="secondary"
                onClick={handleClear}
                disabled={mutation.isPending}
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
                    canEdit && !mutation.isPending && !isProductUpdateDisabled()
                  }
                  lockDescription={getLockDescription()}
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
                      isProductUpdateDisabled() ||
                      !canEdit
                    }
                    onClick={() => {
                      setIsProductUpdate(mode === 'update');
                    }}
                  >
                    {mutation.isPending
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
            productType={ProductType.medication}
            isProductUpdate={isProductUpdate}
          />
        </Container>
      </Box>
    </Paper>
  );
}

interface UseCalculateProductArguments {
  formData: any;
  initialformData: any;
  ticket: Ticket;
  toggleModalOpen: () => void;
  task: Task;
  isProductUpdate: boolean;
  selectedProduct: Concept | ValueSetExpansionContains | null;
  setProductPreviewDetails: (
    details: MedicationPackageDetails | undefined,
  ) => void;
  setProductSaveDetails: (details: ProductSaveDetails | undefined) => void;
  originalConceptId: string | undefined;
  ticketProductId?: number | null;
}

function useCalculateProduct() {
  const mutation = useMutation({
    mutationFn: async ({
      formData,
      initialformData,
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
        productSummary = await productService.previewUpdateMedicationProduct(
          formData,
          originalConcept,
          task.branchPath,
        );
      } else {
        productSummary = await productService.previewCreateMedicationProduct(
          formData,
          task.branchPath,
        );
      }

      const productSaveDetails: ProductSaveDetails = {
        type: isProductUpdate
          ? ProductActionType.update
          : ProductActionType.create,
        productSummary,
        packageDetails: formData as MedicationPackageDetails,
        ticketId: ticket.id,
        ticketProductId: ticketProductId || null,
        nameOverride: null,
        originalConceptId: originalConcept,
        originalPackageDetails: initialformData as MedicationPackageDetails,
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

const useSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['Schema', branchPath],
    queryFn: () =>
      ConfigService.fetchMedicationSchemaData(branchPath, 'medication'),
    enabled: !!branchPath,
  });
};

const useUiSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['uiSchema', branchPath],
    queryFn: () =>
      ConfigService.fetchMedicationUiSchemaData(branchPath, 'medication'),
    enabled: !!branchPath,
  });
};

interface ProductQueryProps {
  productId: string | null | undefined;
  task: Task;
  setFunction?: (data: any) => void;
  disabled?: boolean;
}

const fetchProductDataFn = async ({ productId, task }: ProductQueryProps) => {
  if (!productId) return null;

  return await productService.fetchMedication(productId || '', task.branchPath);
};

const useProductQuery = ({
  productId,
  task,
  setFunction,
  disabled,
}: ProductQueryProps) => {
  const queryKey = ['product', productId, task?.branchPath];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await fetchProductDataFn({ productId, task });
      if (setFunction && data) setFunction(data);
      return data;
    },
    enabled: !!productId && !!task?.branchPath && !disabled,
  });

  const refetchWithParam = async (productId: string | null) => {
    const data = await fetchProductDataFn({
      productId,
      task,
    });
    if (setFunction && data) setFunction(data);
    return data;
  };

  return { ...query, refetchWithParam };
};

export default MedicationAuthoring;
