import { useQuery } from '@tanstack/react-query';
import { ConfigService } from '../../../api/ConfigService';
import { Form } from '@rjsf/mui';
import { useRef, useState } from 'react';
import { evaluateExpression } from './helpers/rjsfUtils';

import UnitValueField from './fields/UnitValueField.tsx';
import AutoCompleteField from './fields/AutoCompleteField.tsx';
import ConditionalArrayField from './fields/ConditionalArrayField.tsx';
import CompactQuantityField from './fields/CompactQuantityField.tsx';
import UnitValueUnWrappedField from './fields/UnitValueUnWrappedField.tsx';
import CustomArrayFieldTemplate from './templates/CustomArrayFieldTemplate.tsx';
import CustomSelectWidget from './widgets/CustomSelectWidget.tsx';
import MuiGridTemplate from './templates/MuiGridTemplate.tsx';
import NumberWidget from './widgets/NumberWidget.tsx';
import ExternalIdentifiers from './fields/bulkBrandPack/ExternalIdentifiers.tsx';

import OneOfArrayWidget from './widgets/OneOfArrayWidget.tsx';
import {
  NonDefiningProperty,
} from '../../../types/product.ts';
import { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { validator } from './helpers/validator.ts';
import CustomTextFieldWidget from './widgets/CustomTextFieldWidget.tsx';
interface AdditionalPropertiesEditProps {
  label: string;
  branch: string;
  nonDefiningProperties?: NonDefiningProperty[];
  onChange: (val: AdditionalPropertiesEditForm) => void;
  // onError: () => void;
}

export interface AdditionalPropertiesEditForm {
  nonDefiningProperties: NonDefiningProperty[];
}

export default function AdditionalPropertiesEdit({
  label,
  branch,
  nonDefiningProperties,
  onChange,
}: AdditionalPropertiesEditProps) {
  const [formKey, setFormKey] = useState(0);
  // const [formData, setFormData] = useState<AdditionalPropertiesEditForm>({nonDefiningProperties: nonDefiningProperties ? nonDefiningProperties.filter(ndp => {
  //   return ndp.type !== NonDefiningPropertyType.REFERENCE_SET;
  // }) : []});
  const [formData, setFormData] = useState<AdditionalPropertiesEditForm>({
    nonDefiningProperties: nonDefiningProperties ? nonDefiningProperties : [],
  });
  const formRef = useRef<React.ElementRef<typeof Form>>(null);
  const [errorSchema, setErrorSchema] = useState<any>({});
  const { data: schema } = useEditSchemaQuery(label, branch);
  const { data: uiSchema } = useEditUiSchemaQuery(label, branch);

  const formContext = {
    onChange: (newFormData: any) => {
      console.log(newFormData);
      setFormData(newFormData);
    },
    formData,
    uiSchema,
    schema,
    errorSchema,
    autoFillDefaults: true,
    evaluateExpression,
  };
  const handleChange = (
    changeEvent: IChangeEvent<AdditionalPropertiesEditForm>,
  ) => {
    if (changeEvent.formData) {
      setFormData(changeEvent.formData);
      onChange(changeEvent.formData);
    }
  };

  const noValidateValidator = {
    validateFormData: () => ({ errors: [], errorSchema: {} }),
    isValid: () => true,
    toErrorList: () => [],
    rawValidation: () => ({ errors: [], validationError: false }),
  };

  return (
    <>
      {uiSchema && schema && (
        <Form
          key={formKey}
          ref={formRef}
          schema={schema as RJSFSchema}
          uiSchema={
            uiSchema as unknown as UiSchema<AdditionalPropertiesEditForm>
          }
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
            ButtonTemplates: {
              SubmitButton: () => null, // Hide the submit button
            },
            // FieldTemplate:CustomFieldTemplate
          }}
          onChange={handleChange}
          // onError={onError}
          validator={{
            ...validator,
            validateFormData: (formData, schema) =>
              validator.validateFormData(formData, schema, uiSchema),
          }}
          disabled={false}
          noHtml5Validate={true}
          noValidate={true}
          showErrorList={false}
          omitExtraData={true}
        ></Form>
      )}
    </>
  );
}

export const useEditSchemaQuery = (label: string, branchPath: string) => {
  return useQuery({
    queryKey: ['edit-schema', branchPath, label],
    queryFn: () => ConfigService.fetchEditSchemaData(label, branchPath),
    enabled: !!branchPath,
  });
};

export const useEditUiSchemaQuery = (label: string, branchPath: string) => {
  return useQuery({
    queryKey: ['edit-uiSchema', branchPath, label],
    queryFn: () => ConfigService.fetchEditUiSchemaData(label, branchPath),
    enabled: !!branchPath,
  });
};
