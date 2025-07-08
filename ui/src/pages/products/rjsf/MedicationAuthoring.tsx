import React, { useCallback, useRef, useState } from 'react';
import { Form } from '@rjsf/mui';
import {
  Box,
  Button,
  Container,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import ajvErrors from 'ajv-errors';

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
import TextFieldWidget from './widgets/TextFieldWidget.tsx';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import productService from '../../../api/ProductService.ts';
import { ConfigService } from '../../../api/ConfigService.ts';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { customizeValidator } from '@rjsf/validator-ajv8';
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
import schema from './base-medication-schema.json';
import uiSchema from './base-medication-ui-schema.json';
import { validator } from './helpers/validator.ts';
import {buildErrorSchema, cleanFormDataBySchema} from "./helpers/validationHelper.ts";
import {ErrorDisplay} from "./components/ErrorDisplay.tsx";
import CustomFieldTemplate from "./templates/CustomFieldTemplate.tsx";

export interface MedicationAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  ticket: Ticket;
  ticketProductId?: string;
  schemaType: string;
}
// const validator = customizeValidator();
// ajvErrors(validator.ajv);
function MedicationAuthoring({
                               task,
                               selectedProduct,
                               ticketProductId,
                               ticket,
                               schemaType,
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

  const { data: schemaTest, isLoading: isSchemaLoading } = useSchemaQuery(task.branchPath, schemaType);
  const { data: uiSchemaTest, isLoading: isUiSchemaLoading } = useUiSchemaQuery(task.branchPath, schemaType);
  const {
    originalConceptId,
    setOriginalConceptId,
    setProductPreviewDetails,
    setProductSaveDetails,
    productSaveDetails,
    loadingPreview,
    isProductUpdate,
    setIsProductUpdate,
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
  const { isLoading: isTicketProductLoading, isFetching: isTicketProductFetching } = useTicketProductQuery({
    ticketProductId,
    ticket,
    setFunction: (data: any) => {
      setFormErrors([]);
      setFormData(data.packageDetails);
      setInitialFormData(data.packageDetails);
      setOriginalConceptId(data.conceptId);
    },
  });

  // const validator = createValidator(schema);
  const mutation = useCalculateProduct();

  const handleToggleCreateModal = useCallback(() => {
    setCreateModalOpen(!createModalOpen);
  }, [createModalOpen]);

  const handleChange = ({ formData }: any) => {

    const newFormData = cleanFormDataBySchema(formData, schema, schema);
    //
    setFormData(newFormData);
    if (!_.isEmpty(formData.productName || formData.containedProducts)) {
      setIsDirty(true);
    }
  };

  const handleSaveToggleModal = () => {
    setSaveModalOpen(!saveModalOpen);
  };

  const handleFormSubmit = async ({ formData }: { formData: any }) => {
    const cleanedFormData = cleanFormDataBySchema(formData, schema, schema);
    const validation = validator.validateFormData(cleanedFormData, schema);
    setFormErrors(validation.errors);
      setFormData(cleanedFormData);
      mutation.mutate({
        formData: cleanedFormData,
        initialformData: initialFormData,
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

  const handleClear = useCallback(() => {
    setFormData({});
    setErrorSchema({});
    setIsDirty(false);
    setFormKey(prev => prev + 1);
  }, []);

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
            message={isProductUpdate ? 'Previewing update product' : 'Previewing new product'}
        />
    );
  }

  const formContext = {
    onChange: (newFormData: any) => {
      setFormData(newFormData);
    },
    formData,
    uiSchema,
    errorSchema,
  };

  const saveDraft = () => {
    setSaveModalOpen(true);
  };

  const onError = (errors: any) => {
    // let newErrorSchema = errors.reduce((acc: any, error: any) => {
    //   _.set(acc, error.property.slice(1), { __errors: [error.message] });
    //   return acc;
    // }, {});
    const newErrorSchema = buildErrorSchema(errors);
    setErrorSchema(newErrorSchema);
    setFormErrors(errors);
  };
  // const onError = (errors: any[]) => {
  //   console.log('Validation Errors:', errors);
  //   const transformedErrors = validator.transformErrors(errors, formData);
  //
  //   // Convert AJV errors to RJSF errorSchema
  //   const newErrorSchema = transformedErrors.reduce((acc: any, error: any) => {
  //     // Use instancePath, convert to dot notation if needed
  //     const path = error.instancePath
  //         ? error.instancePath.replace(/\//g, '.').slice(1) // Convert /path/to/field to path.to.field
  //         : ''; // Handle root-level errors
  //     if (path) {
  //       _.set(acc, path, { __errors: [error.message] });
  //     } else {
  //       // Add root-level errors to __errors
  //       acc.__errors = acc.__errors || [];
  //       acc.__errors.push(error.message);
  //     }
  //     return acc;
  //   }, {});
  //   setErrorSchema(newErrorSchema);
  // };
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
                  TextFieldWidget,
                  OneOfArrayWidget,
                  NumberWidget,
                }}
                templates={{
                  FieldTemplate: CustomFieldTemplate,
                  ArrayFieldTemplate: CustomArrayFieldTemplate,
                  ObjectFieldTemplate: MuiGridTemplate,
                }}
                onChange={handleChange}
                onSubmit={handleFormSubmit}
                onError={onError}
                validator={validator}
                disabled={mutation.isPending}
                noHtml5Validate={true}
                noValidate={false}
                showErrorList={false}
            >
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
                  <ToggleButtonGroup
                      value={mode}
                      exclusive
                      onChange={(_, value) => value && setMode(value)}
                      aria-label="product action mode"
                      color="standard"
                      size="small"
                      sx={{ borderRadius: 4, overflow: 'hidden' }}
                  >
                    <ToggleButton value="create" aria-label="create">
                      Create
                    </ToggleButton>
                    <ToggleButton value="update" aria-label="update">
                      Update
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                      data-testid={mode === 'create' ? 'create-btn' : 'update-btn'}
                      type="submit"
                      variant="contained"
                      color={mode === 'create' ? 'primary' : 'secondary'}
                      disabled={mutation.isPending}
                      onClick={() => setIsProductUpdate(mode === 'update')}
                  >
                    {mutation.isPending
                        ? 'Submitting...'
                        : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                </Box>
              </Box>
            </Form>
            <ProductPartialSaveModal
                packageDetails={formData}
                handleClose={handleSaveToggleModal}
                open={saveModalOpen}
                ticket={ticket}
                existingProductId={ticketProductId}
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
  setProductPreviewDetails: (details: MedicationPackageDetails | undefined) => void;
  setProductSaveDetails: (details: ProductSaveDetails | undefined) => void;
  originalConceptId: string | undefined;
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
        partialSaveName: null,
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

const useSchemaQuery = (branchPath: string, schemaType: string) => {
  return useQuery({
    queryKey: [schemaType + '-Schema', branchPath],
    queryFn: () => ConfigService.fetchMedicationSchemaData(branchPath, schemaType),
    enabled: !!branchPath,
  });
};

const useUiSchemaQuery = (branchPath: string, schemaType: string) => {
  return useQuery({
    queryKey: [schemaType + '-uiSchema', branchPath],
    queryFn: () => ConfigService.fetchMedicationUiSchemaData(branchPath, schemaType),
    enabled: !!branchPath,
  });
};

interface ProductQueryProps {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  setFunction?: (data: any) => void;
}

const fetchProductDataFn = async ({ selectedProduct, task }: ProductQueryProps) => {
  if (!selectedProduct) return null;
  const productId = isValueSetExpansionContains(selectedProduct)
      ? selectedProduct.code
      : selectedProduct.conceptId;

  return await productService.fetchMedication(productId || '', task.branchPath);
};

const useProductQuery = ({ selectedProduct, task, setFunction }: ProductQueryProps) => {
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
