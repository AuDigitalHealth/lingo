import React, { useState, useEffect, useCallback } from 'react';

import { RJSFSchema, UiSchema, FieldProps } from '@rjsf/utils';

const getNestedProperty = (obj: any, path: string) => {
  return path
    .split('/')
    .reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
      obj,
    );
};

// --- Generic Custom Field Component for oneOf with Dynamic Discriminator ---
const OneOfField: React.FC<FieldProps> = props => {
  const {
    schema,
    formData,
    onChange,
    registry,
    uiSchema,
    idSchema,
    formContext,
  } = props;
  const { oneOf, discriminator, properties } = schema;
  const rootFormData = formContext?.rootFormData || {}; // Access rootFormData from formContext

  if (
    !oneOf ||
    oneOf.length === 0 ||
    !discriminator ||
    !discriminator.propertyName
  ) {
    console.error(
      "GenericOneOfField requires 'oneOf' and 'discriminator' in schema.",
    );
    return null;
  }

  const discriminatorProperty = discriminator.propertyName;
  const currentDiscriminatorValue = (formData as any)?.[discriminatorProperty];

  // Get dynamic options configuration from the custom field's ui:options
  const customUiOptions = uiSchema?.['ui:options'] as any;
  const dynamicOptionsConfig = customUiOptions?.dynamicDiscriminatorOptions;

  // Determine the value of the root data property that controls dynamic options
  // If dynamicOptionsConfig.path is empty, it means this GenericOneOfField is at the root
  // and its discriminatorProperty is the controlling value itself.
  const controllingRootValue =
    dynamicOptionsConfig?.path === ''
      ? currentDiscriminatorValue // If it's the root, the discriminator value itself is the controlling value
      : dynamicOptionsConfig?.path
        ? getNestedProperty(rootFormData, dynamicOptionsConfig.path)
        : undefined;

  // Function to find the active oneOf schema based on the discriminator property
  const findActiveOneOfSchema = useCallback(
    (discriminatorValue: string) => {
      return oneOf.find(
        (option: any) =>
          option.properties &&
          option.properties[discriminatorProperty] &&
          option.properties[discriminatorProperty].const === discriminatorValue,
      );
    },
    [oneOf, discriminatorProperty],
  );

  const selectedOneOfSchema = findActiveOneOfSchema(currentDiscriminatorValue);

  // Effect to handle dynamic discriminator value based on controllingRootValue
  useEffect(() => {
    if (dynamicOptionsConfig && controllingRootValue !== undefined) {
      const availableDiscriminatorOptions =
        dynamicOptionsConfig.options[controllingRootValue];

      if (
        availableDiscriminatorOptions &&
        availableDiscriminatorOptions.length > 0
      ) {
        const firstAvailableOptionValue =
          availableDiscriminatorOptions[0].value;

        // Check if the current discriminator value is valid for the new controllingRootValue
        const isCurrentValueValid = availableDiscriminatorOptions.some(
          (opt: any) => opt.value === currentDiscriminatorValue,
        );

        // If currentDiscriminatorValue is not valid or not set, update it to the first valid option
        if (!currentDiscriminatorValue || !isCurrentValueValid) {
          // Reset the entire formData for this object to just the new discriminator value
          // This clears out old, invalid sub-schema data
          onChange({
            [discriminatorProperty]: firstAvailableOptionValue,
          });
        }
      } else {
        // If no options for the current controllingRootValue, clear discriminator value
        if (currentDiscriminatorValue) {
          onChange({
            [discriminatorProperty]: undefined, // Or null, depending on schema nullable
          });
        }
      }
    } else if (
      !currentDiscriminatorValue &&
      properties &&
      properties[discriminatorProperty] &&
      (properties[discriminatorProperty] as RJSFSchema).default
    ) {
      // This handles initial default value if no dynamic options are involved (e.g., top-level on first load)
      onChange({
        [discriminatorProperty]: (
          properties[discriminatorProperty] as RJSFSchema
        ).default,
      });
    }
  }, [
    controllingRootValue,
    currentDiscriminatorValue,
    discriminatorProperty,
    formData,
    onChange,
    dynamicOptionsConfig,
    properties,
  ]);

  if (!selectedOneOfSchema) {
    return (
      <div className="text-red-500">
        No matching option selected or default not applied. Please ensure
        discriminator property is set.
      </div>
    );
  }

  // Get the schema and uiSchema for the discriminator field itself
  const discriminatorSchema = properties?.[discriminatorProperty] as RJSFSchema;
  const discriminatorUiSchema = uiSchema?.[discriminatorProperty] as UiSchema;

  // Destructure StringFieldComponent from registry.fields
  const {
    StringField: StringFieldComponent,
    ObjectField: ObjectFieldComponent,
  } = registry.fields;

  // Determine the options for the discriminator dropdown
  const dropdownOptions = (discriminatorSchema.enum || []).map(
    (value: string) => ({ label: value, value }),
  );

  return (
    <div className="custom-oneof-field p-4 border rounded-md shadow-sm bg-white">
      {/* Render the discriminator dropdown (e.g., packType or productType) */}
      {discriminatorSchema && StringFieldComponent && (
        <div className="mb-3">
          {' '}
          {/* Added mb-4 here */}
          <StringFieldComponent
            {...props} // Pass all original props
            schema={{
              ...discriminatorSchema,
              enum: dropdownOptions.map((opt: any) => opt.value),
              enumNames: dropdownOptions.map((opt: any) => opt.label),
            }}
            uiSchema={{
              ...discriminatorUiSchema,
              'ui:widget': 'select', // Ensure it's rendered as a select
            }}
            formData={currentDiscriminatorValue} // Pass only the discriminator value
            onChange={value => {
              // When discriminator changes, update the formData for the parent field
              onChange({
                [discriminatorProperty]: value, // Only set the discriminator property
              });
            }}
            idSchema={{
              ...idSchema,
              $id: `${idSchema.$id}_${discriminatorProperty}`,
            }}
          />
        </div>
      )}

      {/* Render the actual form for the selected oneOf schema */}
      {ObjectFieldComponent && (
        <ObjectFieldComponent
          {...props} // Pass all original props
          schema={selectedOneOfSchema} // Use the selected oneOf schema
          formData={formData} // Pass the formData for the current field
          onChange={onChange} // Pass the original onChange handler
          // Ensure proper idSchema for nested fields
          idSchema={{
            ...idSchema,
            $id: `${idSchema.$id}_${currentDiscriminatorValue}`,
          }}
          uiSchema={uiSchema} // Pass the entire uiSchema received by this component
        />
      )}
    </div>
  );
};

export default OneOfField;
