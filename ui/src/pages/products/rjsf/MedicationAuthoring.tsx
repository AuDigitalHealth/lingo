import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import {
  applyBrandRename,
  type LastBrands,
} from './helpers/brandRenameHelper.ts';
import { ErrorDisplay } from './components/ErrorDisplay.tsx';
import CustomSelectWidget from './widgets/CustomSelectWidget.tsx';
import { evaluateExpression } from './helpers/rjsfUtils.ts';
import {
  normaliseLoadedPackageDetails,
  seedBrandedProductNamePrefill,
} from './helpers/ticketProductLoadHelper.ts';
import WarningIcon from '@mui/icons-material/Warning';
import CustomTextFieldWidget from './widgets/CustomTextFieldWidget.tsx';
import BrandedProductNameWidget from './widgets/BrandedProductNameWidget.tsx';
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
  const [brandedProductNamePrefill, setBrandedProductNamePrefill] = useState<{
    status: 'suggested' | 'empty' | 'none';
    value?: string;
    index?: number;
  }>({ status: 'none' });
  const [formData, setFormData] = useState<any>({});
  const [initialFormData, setInitialFormData] = useState<any>({});
  const [snowStormFormData, setSnowStormFormData] = useState<any>({});
  const [errorSchema, setErrorSchema] = useState<any>({});
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const formRef = useRef<any>(null);
  const clearSeqRef = useRef(0);
  const lastBrandRef = useRef<LastBrands>({});
  // Set when a ticket product has just been loaded and still needs load-time normalisation
  // (stale discriminator coercion + branded-product-name seeding) once schema/uiSchema exist.
  const pendingLoadNormaliseRef = useRef(false);

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
      lastBrandRef.current = {};
      setBrandedProductNamePrefill({ status: 'none' });
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
      lastBrandRef.current = {};
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
      pendingLoadNormaliseRef.current = true;
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

  const handleChange = ({ formData: incomingFormData }: any) => {
    const updatedFormData = resetDiscriminators(
      schema,
      incomingFormData,
      uiSchema,
    );
    const renamed = applyBrandRename(
      formData,
      updatedFormData,
      lastBrandRef.current,
    );
    setFormData(renamed);

    if (!_.isEmpty(renamed.productName || renamed.containedProducts)) {
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
    lastBrandRef.current = {};
    setErrorSchema({});
    setFormErrors([]);
    setIsDirty(false);
    setMode('create');
    handleClearForm();
    setOriginalConceptId(undefined);
    setSelectedConceptIdentifiers([]);
    setBrandedProductNamePrefill({ status: 'none' });
    // Clear immediately so the form never shows stale data.
    setFormData({});
    setFormKey(prev => prev + 1);
    // Capture this clear's sequence so a stale/raced response from a previous
    // clear cannot overwrite state that belongs to a newer clear.
    const seq = ++clearSeqRef.current;
    // NMPC: prefill brandedProductName from the ticket's HPRA feed data on blank/clear.
    // The backend returns null for AMT and HPRA-less tickets, so null-guarding is
    // sufficient to ensure we only seed the field when a suggestion is available.
    productService
      .fetchBrandedProductNameSuggestion(ticket.id)
      .then(suggestion => {
        if (clearSeqRef.current !== seq) return;
        if (suggestion != null) {
          const prefill = {
            status: 'suggested' as const,
            value: suggestion,
            index: 0,
          };
          setBrandedProductNamePrefill(prefill);
          // Fold the suggestion into already-loaded package details as a FUNCTIONAL update.
          // A plain setFormData here raced the product-load write (whichever landed last won,
          // IEDC-7474), but a functional update composes with concurrent writes instead of
          // clobbering them: it fills the field only if the latest state has it empty. This
          // lets a draft mount with the field already populated instead of waiting a full
          // form re-render for the widget's post-mount seed (CUST1737896). The widget remains
          // the backstop when the product loads after the suggestion.
          setFormData((prev: any) =>
            seedBrandedProductNamePrefill(prev, prefill),
          );
        } else {
          setBrandedProductNamePrefill({ status: 'empty', index: 0 });
        }
      })
      .catch(() => {
        // Suggestion fetch failed (network/auth). Show the "couldn't derive" hint rather
        // than silently leaving the field unseeded with no explanation (CUST1737896).
        if (clearSeqRef.current !== seq) return;
        setBrandedProductNamePrefill({ status: 'empty', index: 0 });
      });
  }, [ticket.id]);
  const { activeConceptIds, activeConceptsLoading } = useActiveConceptIdsByIds(
    task.branchPath,
    originalConceptId ? [originalConceptId] : [],
  );

  // Keep the validator prop's identity stable across renders: RJSF compares it
  // by reference and rebuilds its schemaUtils (losing internal caches) whenever
  // it changes, which an inline object literal forced on every render (#1932).
  const formValidator = useMemo(
    () => ({
      ...validator,
      validateFormData: (formData: any, schema: any) =>
        validator.validateFormData(formData, schema, uiSchema),
    }),
    [uiSchema],
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

  // Normalise a freshly loaded ticket product at the data level, before the form mounts:
  // coerce discriminators saved under an older schema (e.g. variant=medication +
  // productType=noIngredients) and seed the branded-product-name suggestion if it has
  // already arrived. Correcting these through the form instead meant the first change
  // flipped the oneOf branch and the suggestion queued behind that re-render, leaving the
  // field visibly empty on slower machines (CUST1737896). A suggestion that arrives later
  // is still applied by BrandedProductNameWidget.
  useEffect(() => {
    if (!pendingLoadNormaliseRef.current || !schema || !uiSchema) {
      return;
    }
    pendingLoadNormaliseRef.current = false;
    const normalised = normaliseLoadedPackageDetails(
      schema,
      uiSchema,
      formData,
      brandedProductNamePrefill,
    );
    if (normalised !== formData) {
      setFormData(normalised);
    }
  }, [schema, uiSchema, formData, brandedProductNamePrefill]);

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
    task,
    brandedProductNamePrefill,
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
              brandedProductNameWidget: BrandedProductNameWidget,
            }}
            templates={{
              ArrayFieldTemplate: CustomArrayFieldTemplate,
              ObjectFieldTemplate: MuiGridTemplate,
            }}
            onChange={handleChange}
            onSubmit={handleFormSubmit}
            onError={onError}
            validator={formValidator}
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
                    data-testid="preview-btn"
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
