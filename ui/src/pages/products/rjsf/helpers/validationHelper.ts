import _ from 'lodash';

// Resolve a $ref in the schema
export const resolveRef = (
  schema: Record<string, any>,
  ref: string,
): Record<string, any> => {
  const refPath = ref.replace('#/$defs/', '');
  return schema.$defs?.[refPath] || {};
};

// Check if an object is empty
export const isEmptyObject = (obj: any): boolean => {
  return !!obj && typeof obj === 'object' && Object.keys(obj).length === 0;
};

// Get discriminator property from oneOf/anyOf schema
export const getDiscriminatorProperty = (
  schema: Record<string, any>,
): string | null => {
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
        branches.every(
          (branch: any) => branch.properties?.[prop]?.const !== undefined,
        )
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
  path: string[] = [],
): { schema: Record<string, any>; path: string[] } | null => {
  if (!schema || typeof schema !== 'object') return null;

  if (getDiscriminatorProperty(schema)) {
    return { schema, path };
  }

  if (schema.$ref) {
    const resolvedSchema = resolveRef(rootSchema, schema.$ref);
    const result = findDiscriminatorSchema(resolvedSchema, rootSchema, path);
    if (result) return result;
  }

  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      if (value && typeof value === 'object') {
        const result = findDiscriminatorSchema(value, rootSchema, [
          ...path,
          `properties.${key}`,
        ]);
        if (result) return result;
      }
    }
  }

  if (schema.items && typeof schema.items === 'object') {
    const result = findDiscriminatorSchema(schema.items, rootSchema, [
      ...path,
      'items',
    ]);
    if (result) return result;
  }

  return null;
};

// Get discriminator value from formData
export const getDiscriminatorValue = (
  formData: any,
  schemaPath: string[],
  discriminatorProp: string,
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

// Build errorSchema from AJV errors
export const buildErrorSchema = (errors: any[]) => {
  const problematicErrors = errors.filter(e => !e.property && !e.instancePath);
  if (problematicErrors.length > 0) {
    console.log(
      'Errors with empty property and instancePath:',
      safeStringify(problematicErrors),
    );
  }

  const newErrorSchema = errors.reduce((acc: any, error: any) => {
    let path = error.property
      ? error.property.replace(/^\./, '')
      : error.instancePath
        ? error.instancePath.replace(/^\//, '').replace(/\//g, '.')
        : null;

    if (path && path !== '') {
      _.set(acc, path, { __errors: [error.message || 'Validation error'] });
    } else {
      acc.__errors = acc.__errors || [];
      acc.__errors.push(error.message || 'Validation error');
    }
    return acc;
  }, {});
  return newErrorSchema[''] ? newErrorSchema[''] : newErrorSchema;
};

export const safeStringify = (obj: any) => {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    },
    2,
  );
};
export const filterErrors = (errors: any[]): any[] => {
  // Deduplicate errors by path
  const errorsByPath: { [path: string]: any } = errors.reduce(
    (acc: any, error: any) => {
      let path = error.property
        ? error.property.replace(/^\./, '')
        : error.instancePath
          ? error.instancePath.replace(/^\//, '').replace(/\//g, '.')
          : '';
      if (!acc[path]) {
        acc[path] = error;
      }
      return acc;
    },
    {},
  );

  // Return array of unique errors
  return Object.values(errorsByPath);
};
export const removeNullFields = (obj: any, path: string = ''): any => {
  if (obj === null) return undefined;
  if (Array.isArray(obj)) {
    return obj
      .map((item, i) => removeNullFields(item, `${path}[${i}]`))
      .filter(item => item !== undefined);
  }
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key;
      const value = removeNullFields(obj[key], newPath);
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return obj;
};
