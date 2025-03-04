// components/ConditionalArrayField.tsx
import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';
import { Condition, shouldHideField } from '../helpers/conditionUtils.ts';

interface ConditionalArrayFieldProps extends FieldProps {
  uiSchema: {
    'ui:options'?: {
      conditions?: Condition[];
      conditionLogic?: 'and' | 'or';
    };
  };
}

const ConditionalArrayField: React.FC<ConditionalArrayFieldProps> = props => {
  const {
    schema,
    uiSchema,
    registry,
    idSchema,
    name,
    required,
    onChange,
    onBlur,
    onFocus,
    disabled,
    readonly,
    errorSchema,
    formContext = {},
    formData,
  } = props;

  if (schema.type !== 'array' || !schema.items) {
    console.error(
      'ConditionalArrayField must be used with an array schema:',
      schema,
    );
    return <div>Error: Expected an array schema</div>;
  }

  const conditions = uiSchema['ui:options']?.conditions || [];
  const conditionLogic = uiSchema['ui:options']?.conditionLogic || 'and';
  const fullFormData = formContext.formData || {};

  console.log(
    `ConditionalArrayField - name: ${name}, formContext:`,
    formContext,
  );
  console.log(`Checking conditions for ${name}, fullFormData:`, fullFormData);

  const hideField = shouldHideField(fullFormData, conditions, conditionLogic);
  console.log(
    `Field: ${name}, hideField: ${hideField}, showField: ${!hideField}`,
  );
  if (hideField) {
    return null;
  }

  // Enhance formContext with onChange and full formData
  const enhancedFormContext = {
    ...formContext,
    onChange, // Pass the FieldProps onChange
    formData: formContext.formData || {}, // Ensure formData is included
  };

  const { ArrayField } = registry.fields;

  return (
    <ArrayField
      schema={schema as JSONSchema7}
      uiSchema={uiSchema}
      formData={formData}
      registry={registry}
      idSchema={idSchema}
      name={name}
      required={required}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      disabled={disabled}
      readonly={readonly}
      errorSchema={errorSchema}
      formContext={enhancedFormContext}
    />
  );
};

export default ConditionalArrayField;
