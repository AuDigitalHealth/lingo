import React, { useCallback, useEffect, useState } from 'react';
import { Form } from '@rjsf/mui';
import { Container } from '@mui/material';
import schema from './MedicationProductDetails-schema.json';
import uiSchemaTemplate from './MedicationProductDetails-uiSchema.json';
import UnitValueField from './fields/UnitValueField.tsx';

import ProductLoader from '../components/ProductLoader.tsx';
import ParentChildAutoCompleteField from './fields/ParentChildAutoCompleteField.tsx';

import productService from '../../../api/ProductService.ts';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import { customizeValidator } from '@rjsf/validator-ajv8';
import MutuallyExclusiveAutocompleteField from './MutuallyExclusiveAutocompleteField.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import CustomFieldTemplate from './templates/CustomFieldTemplate.tsx';
import NumberWidget from './widgets/NumberWidget.tsx';
import ajvErrors from 'ajv-errors';
import ArrayFieldTemplate from './templates/ArrayFieldTemplate.tsx';
import ExternalIdentifierWidget from './widgets/ExternalIdentifierWidget.tsx';
import TextFieldWidget from './widgets/TextFieldWidget.tsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProductPreviewCreateModal from '../components/ProductPreviewCreateModal.tsx';
import { Task } from '../../../types/task.ts';
import { ProductCreationDetails, ProductType } from '../../../types/product.ts';
import { useParams } from 'react-router-dom';
import { useTicketByTicketNumber } from '../../../hooks/api/tickets/useTicketById.tsx';
import { Ticket } from '../../../types/tickets/ticket.ts';
import { MedicationPackageDetails } from '../../../types/product.ts';

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
  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [formData, setFormData] = useState({});

  const mutation = useCalculateProduct();

  const { isPending, data, isSuccess } = mutation;

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleToggleCreateModal = useCallback(() => {
    setCreateModalOpen(!createModalOpen);
  }, [setCreateModalOpen, createModalOpen]);

  const { ticketNumber } = useParams();
  const useTicketQuery = useTicketByTicketNumber(ticketNumber, true);

  const fetchProductData = useCallback(() => {
    if (!selectedProduct) return;

    setLoadingProduct(true);
    const productId = isValueSetExpansionContains(selectedProduct)
      ? selectedProduct.code
      : selectedProduct.conceptId;

    productService
      .fetchMedication(productId || '', task.branchPath)
      .then(mp => {
        if (mp.productName) {
          setFormData(mp);
        }
      })
      .catch(() => setLoadingProduct(false))
      .finally(() => setLoadingProduct(false));
  }, [selectedProduct]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const handleChange = ({ formData }: any) => {
    setFormData(formData);
  };
  const uiSchema = uiSchemaTemplate;

  // Get customized validator
  // const validator = useMemo(() => createCustomizedValidator(), []);

  if (isLoadingProduct) {
    return <ProductLoader message="Loading Product details" />;
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
            ArrayFieldTemplate: ArrayFieldTemplate,
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

// Custom form submission handler

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

export default MedicationAuthoringV2;
