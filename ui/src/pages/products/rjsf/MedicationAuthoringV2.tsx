import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Form } from '@rjsf/mui';
import { Container } from '@mui/material';
import schema from './MedicationProductDetails-schema.json';
import uiSchemaTemplate from './MedicationProductDetails-uiSchema.json';
import UnitValueField from './fields/UnitValueField.tsx';

import ProductLoader from '../components/ProductLoader.tsx';
import ParentChildAutoCompleteField from './fields/ParentChildAutoCompleteField.tsx';

import { createCustomizedValidator, transformErrors } from './validation/CustomValidation.ts'; // Import the validation functions
import productService from '../../../api/ProductService.ts';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';
import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import validator from '@rjsf/validator-ajv8';
import MutuallyExclusiveAutocompleteField from "./MutuallyExclusiveAutocompleteField.tsx";
import AutoCompleteField from "./fields/AutoCompleteField.tsx";
import CustomFieldTemplate from "./templates/CustomFieldTemplate.tsx";
import CustomArrayFieldTemplate from "./templates/CustomArrayFieldTemplate.tsx";
import NumberWidget from "./widgets/NumberWidget.tsx";

export interface MedicationAuthoringV2Props {
    selectedProduct: Concept | ValueSetExpansionContains | null;
}

function MedicationAuthoringV2({ selectedProduct }: MedicationAuthoringV2Props) {
    const [isLoadingProduct, setLoadingProduct] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchProductData = useCallback(() => {
        if (!selectedProduct) return;

        setLoadingProduct(true);
        const productId = isValueSetExpansionContains(selectedProduct)
            ? selectedProduct.code
            : selectedProduct.conceptId;

        productService
            .fetchMedication(productId || '', 'MAIN')
            .then((mp) => {
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
        console.log(formData);
        setFormData(formData);
    };
    const uiSchema =uiSchemaTemplate;

    // Get customized validator
    // const validator = useMemo(() => createCustomizedValidator(), []);

    if (isLoadingProduct) {
        return <ProductLoader message="Loading Product details" />;
    }

    return (
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
                templates={{FieldTemplate:CustomFieldTemplate}}
                validator={validator} // Pass the customized validator
                transformErrors={transformErrors} // Apply custom error transformations
                // focusOnFirstError
                // showErrorList={false}
                widgets={{NumberWidget}}
                onError={(errors) => console.log('Validation Errors:', errors)}
                // liveValidate
            />
        </Container>
    );
}

// Custom form submission handler
const handleFormSubmit = ({ formData }: any) => {
    console.log('Submitted FormData:', formData);
};

export default MedicationAuthoringV2;
