import _ from 'lodash';

// Resolve a $ref in the schema
export const resolveRef = (schema: Record<string, any>, ref: string): Record<string, any> => {
  const refPath = ref.replace('#/$defs/', '');
  return schema.$defs?.[refPath] || {};
};

// Check if an object is empty
export const isEmptyObject = (obj: any): boolean => {
  return !!obj && typeof obj === 'object' && Object.keys(obj).length === 0;
};

// Get discriminator property from oneOf/anyOf schema
export const getDiscriminatorProperty = (schema: Record<string, any>): string | null => {
  if (!schema || typeof schema !== 'object') return null;

  // Explicit discriminator
  if (schema.discriminator?.propertyName) {
    return schema.discriminator.propertyName;
  }

  // Implicit discriminator in oneOf/anyOf
  const branches = schema.oneOf || schema.anyOf;
  if (branches?.length) {
    const firstBranchProps = branches[0]?.properties || {};
    for (const prop in firstBranchProps) {
      if (
          firstBranchProps[prop].const &&
          branches.every((branch: any) => branch.properties?.[prop]?.const !== undefined)
      ) {
        return prop;
      }
    }
  }
  return null;
};

// Find schema with discriminator and its path
export const findDiscriminatorSchema = (
    schema: Record<string, any>,
    rootSchema: Record<string, any>,
    path: string[] = []
): { schema: Record<string, any>; path: string[] } | null => {
  if (!schema || typeof schema !== 'object') return null;

  // Check for discriminator
  if (getDiscriminatorProperty(schema)) {
    return { schema, path };
  }

  // Handle $ref
  if (schema.$ref) {
    const resolvedSchema = resolveRef(rootSchema, schema.$ref);
    const result = findDiscriminatorSchema(resolvedSchema, rootSchema, path);
    if (result) return result;
  }

  // Check properties
  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      if (value && typeof value === 'object') {
        const result = findDiscriminatorSchema(value, rootSchema, [...path, `properties.${key}`]);
        if (result) return result;
      }
    }
  }

  // Check array items
  if (schema.items && typeof schema.items === 'object') {
    const result = findDiscriminatorSchema(schema.items, rootSchema, [...path, 'items']);
    if (result) return result;
  }

  return null;
};

// Get discriminator value from formData
export const getDiscriminatorValue = (
    formData: any,
    schemaPath: string[],
    discriminatorProp: string
): any => {
  let current = formData;
  for (const part of schemaPath) {
    if (!current) return undefined;
    if (part === 'items') {
      current = Array.isArray(current) ? current[0] : undefined;
    } else if (part.startsWith('properties.')) {
      current = current?.[part.replace('properties.', '')];
    } else {
      current = current?.[part];
    }
  }
  return current?.[discriminatorProp];
};

// Clean form data based on schema
export const cleanFormDataBySchema = (
    data: any,
    schema: Record<string, any>,
    rootSchema: Record<string, any>
): any => {
  if (!data || typeof data !== 'object') return data;

  // Resolve $ref
  const resolvedSchema = schema.$ref ? resolveRef(rootSchema, schema.$ref) : schema;

  // Handle oneOf/anyOf
  const branches = resolvedSchema.oneOf || resolvedSchema.anyOf;
  if (branches?.length) {
    const discriminatorProp = getDiscriminatorProperty(resolvedSchema);
    const branchValue = data[discriminatorProp];
    if (!discriminatorProp || !branchValue) return data;

    const matchingBranch = branches.find(
        (branch: any) => branch.properties?.[discriminatorProp]?.const === branchValue
    );
    if (!matchingBranch) return data;

    const validProperties = Object.keys(matchingBranch.properties || {});
    const cleanedData: Record<string, any> = { [discriminatorProp]: branchValue };

    for (const key of Object.keys(data)) {
      if (validProperties.includes(key)) {
        const propSchema = matchingBranch.properties[key];
        const cleanedValue = cleanFormDataBySchema(data[key], propSchema, rootSchema);
        if (cleanedValue !== undefined && !isEmptyObject(cleanedValue)) {
          cleanedData[key] = cleanedValue;
        }
      }
    }
    return Object.keys(cleanedData).length > 0 ? cleanedData : undefined;
  }

  // Handle arrays
  if (resolvedSchema.type === 'array' && Array.isArray(data)) {
    const itemSchema = resolvedSchema.items?.$ref
        ? resolveRef(rootSchema, resolvedSchema.items.$ref)
        : resolvedSchema.items;
    const cleanedItems = data
        .map((item) => cleanFormDataBySchema(item, itemSchema, rootSchema))
        .filter((item) => item !== undefined && !isEmptyObject(item));
    return cleanedItems.length > 0 ? cleanedItems : undefined;
  }

  // Handle objects
  if (resolvedSchema.type === 'object' && resolvedSchema.properties) {
    const cleanedData: Record<string, any> = {};
    for (const key of Object.keys(resolvedSchema.properties)) {
      if (key in data) {
        const propSchema = resolvedSchema.properties[key];
        const cleanedValue = cleanFormDataBySchema(data[key], propSchema, rootSchema);
        if (cleanedValue !== undefined && !isEmptyObject(cleanedValue)) {
          cleanedData[key] = cleanedValue;
        }
      }
    }
    return Object.keys(cleanedData).length > 0 ? cleanedData : undefined;
  }

  return data;
};
 const safeStringify = (obj: any) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  }, 2);
};
// Build errorSchema from AJV errors
export const buildErrorSchema = (errors: any[]) => {
  // Log errors with empty property or instancePath for debugging
  const problematicErrors = errors.filter(e => !e.property && !e.instancePath);
  if (problematicErrors.length > 0) {
    console.log('Errors with empty property and instancePath:', safeStringify(problematicErrors));
  }

  const newErrorSchema = errors.reduce((acc: any, error: any) => {
    // Use error.property or instancePath, ensure no empty path
    let path = error.property
        ? error.property.replace(/^\./, '')
        : error.instancePath
            ? error.instancePath.replace(/^\//, '').replace(/\//g, '.')
            : null;

    // Explicitly check for empty string path
    if (path && path !== '') {
      _.set(acc, path, { __errors: [error.message || 'Validation error'] });
    } else {
      // Root-level errors
      acc.__errors = acc.__errors || [];
      acc.__errors.push(error.message || 'Validation error');
    }
    return acc;
  }, {});
  const cleaned= newErrorSchema[""] ? newErrorSchema[""] : newErrorSchema;
  return cleaned;
};

