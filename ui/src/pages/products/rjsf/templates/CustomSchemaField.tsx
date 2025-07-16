import React from 'react';
import { getUiOptions, RegistryFieldsType, SchemaFieldProps } from '@rjsf/utils';

const CustomSchemaField: React.FC<SchemaFieldProps> = (props) => {
    const { schema, uiSchema, idSchema, registry, name } = props;

    // Check for discriminator and suppression conditions
    const uiOptions = getUiOptions(uiSchema);
    const hasDiscriminator = !!schema.discriminator;
    const isDiscriminatorField = hasDiscriminator && name === schema.discriminator?.propertyName;
    const hideOneOf = uiOptions.hideOneOf || uiSchema?.['ui:discriminator']?.hidden;

    // Debug logging
    console.log('CustomSchemaField:', {
        id: idSchema.$id,
        name,
        hasDiscriminator,
        isDiscriminatorField,
        hideOneOf,
        uiOptions,
        discriminatorProperty: schema.discriminator?.propertyName,
        schemaType: schema.type,
        schemaOneOf: !!schema.oneOf,
    });

    // Suppress only the discriminator field (e.g., productType as a oneOf selector) when hideOneOf is true
    if (isDiscriminatorField && hideOneOf && !schema.type) {
        console.log(`Suppressing discriminator field: ${idSchema.$id}`);
        return null;
    }

    // Delegate to the appropriate field renderer from registry
    const { fields } = registry;
    let DefaultField: React.ComponentType<SchemaFieldProps> | undefined;

    // Handle based on schema type
    if (schema.type === 'object') {
        DefaultField = fields.ObjectField;
    } else if (schema.oneOf || schema.anyOf) {
        DefaultField = fields.OneOfField || fields.AnyOfField;
    } else if (schema.type === 'string') {
        DefaultField = fields.StringField;
    } else if (schema.type === 'number' || schema.type === 'integer') {
        DefaultField = fields.NumberField;
    } else if (schema.type === 'boolean') {
        DefaultField = fields.BooleanField;
    } else if (schema.type === 'array') {
        DefaultField = fields.ArrayField;
    } else {
        DefaultField = fields.StringField; // Fallback for undefined types
    }

    if (!DefaultField) {
        console.warn(`No default field renderer found for ${idSchema.$id} (type: ${schema.type}, name: ${name})`);
        return null;
    }

    console.log(`Rendering ${idSchema.$id} with ${DefaultField.name || 'unknown field'}`);
    return <DefaultField {...props} />;
};

export default CustomSchemaField;