import React, { useCallback, useEffect, useState } from 'react';
import { Form } from '@rjsf/mui';
import { Container } from '@mui/material';
import UnitValueField from './fields/UnitValueField.tsx';
import ProductLoader from '../components/ProductLoader.tsx';
import ParentChildAutoCompleteField from './fields/ParentChildAutoCompleteField.tsx';
import productService from '../../../api/ProductService.ts';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { customizeValidator } from '@rjsf/validator-ajv8';
import MutuallyExclusiveAutocompleteField from './fields/MutuallyExclusiveAutocompleteField.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import CustomFieldTemplate from './templates/CustomFieldTemplate.tsx';
import NumberWidget from './widgets/NumberWidget.tsx';
import ajvErrors from 'ajv-errors';
import ArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';
import ExternalIdentifierWidget from './widgets/ExternalIdentifierWidget.tsx';
import TextFieldWidget from './widgets/TextFieldWidget.tsx';
import { useMutation, useQuery } from '@tanstack/react-query';
import ProductPreviewCreateModal from '../components/ProductPreviewCreateModal.tsx';
import { Task } from '../../../types/task.ts';
import {
  MedicationPackageDetails,
  ProductCreationDetails,
  ProductType,
} from '../../../types/product.ts';
import { useParams } from 'react-router-dom';
import { useTicketByTicketNumber } from '../../../hooks/api/tickets/useTicketById.tsx';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { ConfigService } from '../../../api/ConfigService.ts';
// import schemaTest from "./MedicationProductDetails-schema.json";
// import uiSchemaTest from "./MedicationProductDetails-uiSchema.json";
import CustomArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';

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

  const { data: schema, isLoading: isSchemaLoading } = useSchemaQuery(
    task.branchPath,
  );
  const { data: uiSchema, isLoading: isUiSchemaLoading } = useUiSchemaQuery(
    task.branchPath,
  );
  const mutation = useCalculateProduct();

  const { isPending, data } = mutation;

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleToggleCreateModal = useCallback(() => {
    setCreateModalOpen(!createModalOpen);
  }, [setCreateModalOpen, createModalOpen]);

  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, true);

  const { isLoading } = useProductQuery({
    selectedProduct: selectedProduct,
    task: task,
    setFunction: setFormData,
  });

  const handleChange = ({ formData }: any) => {
    setFormData(formData);
  };

  if (isLoading) {
    return <ProductLoader message="Loading Product details" />;
  }

  if (isSchemaLoading || isUiSchemaLoading) {
    return <ProductLoader message="Loading Schema" />;
  }

  const handleFormSubmit = ({ formData }: any) => {
    mutation.mutate({
      formData,
      ticket: useTicketQuery.data as Ticket,
      toggleModalOpen: handleToggleCreateModal,
      task,
    });
  };

  return (
    <>
      <Container>
        <Form
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={handleChange}
          onSubmit={handleFormSubmit}
          fields={{
            UnitValueField,
            AutoCompleteField,
            ParentChildAutoCompleteField,
            MutuallyExclusiveAutocompleteField,
          }}
          templates={{
            FieldTemplate: CustomFieldTemplate,
            // ArrayFieldTemplate: ArrayFieldTemplate,
            // ObjectFieldTemplate: ObjectFieldTemplate,
            // ArrayFieldItemTemplate:ArrayFieldItemTemplate,
            ArrayFieldTemplate: CustomArrayFieldTemplate,
          }}
          validator={validator} // Pass the customized validator
          // transformErrors={transformErrors} // Apply custom error transformations
          // focusOnFirstError
          // showErrorList={false}
          widgets={{ NumberWidget, ExternalIdentifierWidget, TextFieldWidget }}
          onError={errors => console.log('Validation Errors:', errors)}
          // liveValidate
          formContext={{ formData }} // Pass formData in formContext
          disabled={isPending}
        />
      </Container>
      <ProductPreviewCreateModal
        open={createModalOpen}
        handleClose={handleToggleCreateModal}
        productCreationDetails={data}
        branch={task.branchPath}
        ticket={useTicketQuery.data as Ticket}
        productType={ProductType.medication}
      />
    </>
  );
}

interface UseCalculateProductArguments {
  formData: any;
  ticket: Ticket;
  toggleModalOpen: () => void;
  task: Task;
}

export function useCalculateProduct() {
  const mutation = useMutation({
    mutationFn: async ({
      formData,
      ticket,
      toggleModalOpen,
      task,
    }: UseCalculateProductArguments) => {
      const productSummary = await productService.previewNewMedicationProduct(
        formData,
        task.branchPath,
      );

      const productCreationObj: ProductCreationDetails = {
        productSummary: productSummary,
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

export const useSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['medication-schema', branchPath],
    queryFn: () => ConfigService.fetchMeddicationSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

export const useUiSchemaQuery = (branchPath: string) => {
  return useQuery({
    queryKey: ['medication-uiSchema', branchPath],
    queryFn: () => ConfigService.fetchMedicationUiSchemaData(branchPath),
    enabled: !!branchPath,
  });
};

const fetchProductDataFn = async ({
  selectedProduct,
  task,
}: ProductQueryProps) => {
  if (!selectedProduct) return null;

  const productId = isValueSetExpansionContains(selectedProduct)
    ? selectedProduct.code
    : selectedProduct.conceptId;

  try {
    const mp = await productService.fetchMedication(
      productId || '',
      task.branchPath,
    );
    if (mp.productName) {
      return mp;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

interface ProductQueryProps {
  selectedProduct: Concept | ValueSetExpansionContains | null;
  task: Task;
  setFunction?: ({}) => void;
}

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
    queryKey: queryKey,
    queryFn: async () => {
      const data = await fetchProductDataFn({ selectedProduct, task });
      if (setFunction && data) {
        setFunction(data);
      }
      return data;
    },
    enabled: !!selectedProduct && !!task?.branchPath,
  });
};

export default MedicationAuthoringV2;
