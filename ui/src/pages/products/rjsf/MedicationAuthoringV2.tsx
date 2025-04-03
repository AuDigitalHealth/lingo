import React, { useCallback, useState, useRef } from 'react';
import { Form } from '@rjsf/mui';
import { Container, Button, Box, Paper } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import _ from 'lodash';
import ajvErrors from 'ajv-errors';

import UnitValueField from './fields/UnitValueField.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import ParentChildAutoCompleteField from './fields/ParentChildAutoCompleteField.tsx';
import MutuallyExclusiveAutocompleteField from './fields/MutuallyExclusiveAutocompleteField.tsx';
import ConditionalArrayField from './fields/ConditionalArrayField.tsx';
import CompactQuantityField from './fields/CompactQuantityField.tsx';
import UnitValueUnWrappedField from './fields/UnitValueUnWrappedField.tsx';
import ProductLoader from '../components/ProductLoader.tsx';
import ProductPreviewCreateModal from '../components/ProductPreviewCreateModal.tsx';
import CustomFieldTemplate from './templates/CustomFieldTemplate.tsx';
import CustomArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';
import CustomObjectFieldTemplate from './templates/CustomObjectFieldTemplate.tsx';
import NumberWidget from './widgets/NumberWidget.tsx';
import TextFieldWidget from './widgets/TextFieldWidget.tsx';
import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import productService from '../../../api/ProductService.ts';
import { ConfigService } from '../../../api/ConfigService.ts';
import { useTicketByTicketNumber } from '../../../hooks/api/tickets/useTicketById.tsx';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { Task } from '../../../types/task.ts';
import { Ticket } from '../../../types/tickets/ticket.ts';
import {
  MedicationPackageDetails,
  ProductCreationDetails,
  ProductType,
} from '../../../types/product.ts';

export interface MedicationAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
}

const validator = customizeValidator();
ajvErrors(validator.ajv);

function MedicationAuthoringV2({
                                 task,
                                 selectedProduct,
                               }: MedicationAuthoringV2Props) {
  const [formData, setFormData] = useState({});
  const [errorSchema, setErrorSchema] = useState({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const formRef = useRef<any>(null); // Ref to access the RJSF Form instance

  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, true);
  const { data: schema, isLoading: isSchemaLoading } = useSchemaQuery(task.branchPath);
  const { data: uiSchema, isLoading: isUiSchemaLoading } = useUiSchemaQuery(task.branchPath);
  const { isLoading, isFetching } = useProductQuery({
    selectedProduct,
    task,
    setFunction: setFormData,
  });
  const mutation = useCalculateProduct();
  const { isPending, data } = mutation;

  const handleToggleCreateModal = useCallback(() => {
    setCreateModalOpen(!createModalOpen);
  }, [createModalOpen]);

  const handleChange = ({ formData }: any) => {
    setFormData(formData);
  };

  const handleFormSubmit = ({ formData }: any) => {
    mutation.mutate({
      formData,
      ticket: useTicketQuery.data as Ticket,
      toggleModalOpen: handleToggleCreateModal,
      task,
    });
  };

  const handleClear = useCallback(() => {
    setFormData({});
    if (formRef.current) {
      formRef.current.reset();
    }
  }, []);

  if (isLoading || isFetching) {
    return <ProductLoader message="Loading Product details" />;
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
                  UnitValueField,
                  AutoCompleteField,
                  ParentChildAutoCompleteField,
                  MutuallyExclusiveAutocompleteField,
                  ConditionalArrayField,
                  CompactQuantityField,
                  UnitValueUnWrappedField,
                }}
                templates={{
                  FieldTemplate: CustomFieldTemplate,
                  ArrayFieldTemplate: CustomArrayFieldTemplate,
                  ObjectFieldTemplate: CustomObjectFieldTemplate,
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
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isPending}
                >
                  {isPending ? 'Submitting...' : 'Preview'}
                </Button>
              </Box>
            </Form>
            <ProductPreviewCreateModal
                open={createModalOpen}
                handleClose={handleToggleCreateModal}
                productCreationDetails={data}
                branch={task.branchPath}
                ticket={useTicketQuery.data as Ticket}
                productType={ProductType.medication}
            />
          </Container>
        </Box>
      </Paper>
  );
}

interface UseCalculateProductArguments {
  formData: any;
  ticket: Ticket;
  toggleModalOpen: () => void;
  task: Task;
}

 function useCalculateProduct() {
  const mutation = useMutation({
    mutationFn: async ({
                         formData,
                         ticket,
                         task,
                       }: UseCalculateProductArguments) => {
      const productSummary = await productService.previewNewMedicationProduct(
          formData,
          task.branchPath,
      );
      const productCreationObj: ProductCreationDetails = {
        productSummary,
        packageDetails: formData as MedicationPackageDetails,
        ticketId: ticket.id,
        partialSaveName: null,
        saveName: '',
        nameOverride: null,
      };
      return productCreationObj;
    },
    onSuccess: (_, variables) => {
      variables.toggleModalOpen();
    },
  });
  return mutation;
}

 const useSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['medication-schema', branchPath],
    queryFn: () => ConfigService.fetchMeddicationSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

 const useUiSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['medication-uiSchema', branchPath],
    queryFn: () => ConfigService.fetchMedicationUiSchemaData(branchPath),
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

  const mp = await productService.fetchMedication(productId || '', task.branchPath);
  return mp.productName ? mp : null;
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

export default MedicationAuthoringV2;
