import React, { useEffect, useState } from 'react';
// import './App.css';
import { Form } from '@rjsf/mui';
import { Container } from '@mui/material';
import validator from '@rjsf/validator-ajv8';

import schema from './MedicationProductDetails-schema.json';
import uiSchema from './MedicationProductDetails-uiSchema.json';

import UnitValueField from './UnitValueField.tsx';
import AutoCompleteField from './AutoCompleteField.tsx';
import productService from '../../../api/ProductService.ts';
import { isValueSetExpansionContains } from '../../../types/predicates/isValueSetExpansionContains.ts';

import { Concept } from '../../../types/concept.ts';
import type { ValueSetExpansionContains } from 'fhir/r4';
import ProductLoader from '../components/ProductLoader.tsx';
import ParentChildAutoCompleteField from './ParentChildAutoCompleteField.tsx';
import ArrayFieldWithTitle from './ArrayFieldWithTitle.tsx';
import SectionWidget from './SectionWidget.tsx';

export interface MedicationAuthoringV2Props {
  selectedProduct: Concept | ValueSetExpansionContains | null;
}

function MedicationAuthoringV2({
  selectedProduct,
}: MedicationAuthoringV2Props) {
  const [isLoadingProduct, setLoadingProduct] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (selectedProduct) {
      setLoadingProduct(true);
      productService
        .fetchMedication(
          selectedProduct
            ? isValueSetExpansionContains(selectedProduct)
              ? (selectedProduct.code as string)
              : (selectedProduct.conceptId as string)
            : '',
          'MAIN',
        )
        .then(mp => {
          if (mp.productName) {
            setFormData(mp);
            setLoadingProduct(false);
          }
        })
        .catch(err => {
          setLoadingProduct(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  const handleChange = ({ formData }) => {
    setFormData(formData);
  };

  const log = type => console.log.bind(console, type);
  if (isLoadingProduct) {
    return <ProductLoader message={'Loading Product details'} />;
  }
  return (
    <Container>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        onChange={handleChange}
        fields={{
          UnitValueField,
          AutoCompleteField,
          ParentChildAutoCompleteField,
          SectionWidget,
        }}
        widgets={{}}
        formData={formData}
        onSubmit={({ formData }) => console.log('Submitted:', formData)} // Log submission
        onError={errors => console.log('Errors:', errors)} // Log errors
        validator={validator}
      />
    </Container>
  );
}

export default MedicationAuthoringV2;
