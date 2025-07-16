import React, { useEffect, useCallback } from 'react';
import {
  FieldProps,
  getUiOptions,
  retrieveSchema,
  toIdSchema,
  RJSFSchema,
  UiSchema,
} from '@rjsf/utils';

const CustomOneOfField: React.FC<FieldProps> = props => {
  const {
    schema,
    formData,
    onChange,
    registry,
    uiSchema,
    idSchema,
    formContext,
    name,
  } = props;

  const { oneOf, discriminator, properties } = schema;

  // Extract UI options from uiSchema
  const uiOptions = getUiOptions(uiSchema);
  const hideOneOfSelector = uiOptions.hideOneOfSelector === true;

  // Defensive fallback if no oneOf or discriminator property
  if (
    !oneOf ||
    oneOf.length === 0 ||
    !discriminator ||
    !discriminator.propertyName
  ) {
    return null;
  }

  const discriminatorProperty = discriminator.propertyName;

  // Current discriminator value from formData
  const currentDiscriminatorValue = formData?.[discriminatorProperty];

  // Find selected schema based on discriminator const value
  const findSelectedSchema = useCallback(
    (discriminatorVal: string | undefined) => {
      return oneOf.find(
        option =>
          option.properties &&
          option.properties[discriminatorProperty] &&
          option.properties[discriminatorProperty].const === discriminatorVal,
      );
    },
    [oneOf, discriminatorProperty],
  );

  const selectedSchema = findSelectedSchema(currentDiscriminatorValue);

  // If no matching schema, show error message
  if (!selectedSchema) {
    return (
      <div style={{ color: 'red' }}>
        No matching option selected or default not applied. Please set
        discriminator property.
      </div>
    );
  }

  // Prepare idSchemas for discriminator and nested object
  const discriminatorIdSchema = {
    $id: `${idSchema.$id}_${discriminatorProperty}`,
  };

  // Retrieve schemas for discriminator and selected oneOf branch
  const discriminatorSchema = properties?.[discriminatorProperty] as RJSFSchema;
  const discriminatorUiSchema = uiSchema?.[discriminatorProperty] as UiSchema;

  const retrievedSchema = retrieveSchema(
    selectedSchema,
    registry.definitions,
    formData,
  );
  const nestedIdSchema = toIdSchema(
    retrievedSchema,
    idSchema.$id,
    registry.definitions,
  );

  // Extract fields from registry
  const { StringField, ObjectField } = registry.fields;

  // Dropdown options for discriminator property
  const dropdownOptions = (discriminatorSchema.enum || []).map(
    (val: string) => ({
      label: val,
      value: val,
    }),
  );

  return (
    <div
      className="custom-oneof-field"
      style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
    >
      {/* Conditionally render discriminator dropdown only if hideOneOfSelector is false */}
      {!hideOneOfSelector && discriminatorSchema && StringField && (
        <div style={{ marginBottom: 16 }}>
          <StringField
            {...props}
            schema={{
              ...discriminatorSchema,
              enum: dropdownOptions.map(opt => opt.value),
              enumNames: dropdownOptions.map(opt => opt.label),
            }}
            uiSchema={{
              ...discriminatorUiSchema,
              'ui:widget': 'select',
            }}
            formData={currentDiscriminatorValue}
            onChange={value => {
              // Update discriminator property and reset oneOf_select helper if used
              onChange({
                ...formData,
                [discriminatorProperty]: value,
                oneOf_select: value,
              });
            }}
            idSchema={discriminatorIdSchema}
          />
        </div>
      )}

      {/* Render the selected schema object fields */}
      {ObjectField && (
        <ObjectField
          {...props}
          schema={retrievedSchema}
          formData={formData}
          onChange={onChange}
          idSchema={nestedIdSchema}
          uiSchema={uiSchema}
        />
      )}
    </div>
  );
};

export default CustomOneOfField;
