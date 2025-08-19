import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Form } from '@rjsf/mui';
import {
  Box,
  Button,
  Container,
  FormControlLabel,
  Paper,
  Switch,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';

import UnitValueField from './fields/UnitValueField.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import ConditionalArrayField from './fields/ConditionalArrayField.tsx';
import CompactQuantityField from './fields/CompactQuantityField.tsx';
import UnitValueUnWrappedField from './fields/UnitValueUnWrappedField.tsx';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewManageModal from '../components/ProductPreviewManageModal.tsx';
import CustomArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';

import NumberWidget from './widgets/NumberWidget.tsx';
import ExternalIdentifiers from './fields/bulkBrandPack/ExternalIdentifiers.tsx';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import productService from '../../../api/ProductService.ts';
import { ConfigService } from '../../../api/ConfigService.ts';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
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

export interface MedicationAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  ticketProductId?: string;
}

function MedicationAuthoring({
  task,
  selectedProduct,
  ticketProductId,
  ticket,
}: MedicationAuthoringV2Props) {
  const [formKey, setFormKey] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [initialFormData, setInitialFormData] = useState<any>({});
  const [errorSchema, setErrorSchema] = useState<any>({});
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const formRef = useRef<any>(null);
  const [mode, setMode] = useState<'create' | 'update'>('create');
  const [isDirty, setIsDirty] = useState(false);
  const [formErrors, setFormErrors] = useState<any[]>([]);

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
  } = useAuthoringStore();

  const { isLoading, isFetching } = useProductQuery({
    selectedProduct,
    task,
    setFunction: (data: any) => {
      setFormData(data);
      setInitialFormData(data);
      setFormErrors([]);
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
      setOriginalConceptId(data.conceptId);
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
      partialSaveName: ticketProductId,
    });
  };

  const handleClear = useCallback(() => {
    setFormData({});
    setErrorSchema({});
    setFormErrors([]);
    setIsDirty(false);
    setFormKey(prev => prev + 1);
    setMode(prevState => 'create');
    handleClearForm();
    setOriginalConceptId(undefined);
    setSelectedConceptIdentifiers([]);
  }, []);

  // Clear form data when schemaType changes
  useEffect(() => {
    handleClear();
  }, [handleClear]);

  if (
    isLoading ||
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
              UnitValueUnWrappedField,
              UnitValueField,
              CompactQuantityField,
            }}
            widgets={{
              TextWidget: CustomTextFieldWidget,
              OneOfArrayWidget,
              NumberWidget,
              SelectWidget: CustomSelectWidget,
            }}
            templates={{
              ArrayFieldTemplate: CustomArrayFieldTemplate,
              ObjectFieldTemplate: MuiGridTemplate,
              // FieldTemplate:CustomFieldTemplate
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
                  disabled={mutation.isPending}
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
  partialSaveName?: string | null;
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
      partialSaveName,
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
        partialSaveName: partialSaveName || null,
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
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  setFunction?: (data: any) => void;
}

const fetchProductDataFn = async ({
  selectedProduct,
  task,
}: ProductQueryProps) => {
  if (!selectedProduct) return null;
  const productId = isValueSetExpansionContains(selectedProduct)
    ? selectedProduct.code
    : selectedProduct.conceptId;

  return await productService.fetchMedication(productId || '', task.branchPath);
};

const useProductQuery = ({
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

export default MedicationAuthoring;
