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

export const findDiscriminatorSchema = (
  schema: any,
  rootSchema: any,
): { schema: any; path: string[] } | null => {
  if (schema.discriminator) {
    return { schema, path: [] };
  }

  const searchSchema = (
    currentSchema: any,
    currentPath: string[] = [],
  ): { schema: any; path: string[] } | null => {
    // Check properties
    if (currentSchema.properties) {
      for (const [propName, propSchema] of Object.entries(
        currentSchema.properties,
      )) {
        if (propSchema.discriminator) {
          return { schema: propSchema, path: [...currentPath, propName] };
        }
        if (
          propSchema.properties ||
          propSchema.items ||
          propSchema.oneOf ||
          propSchema.anyOf
        ) {
          const result = searchSchema(propSchema, [...currentPath, propName]);
          if (result) return result;
        }
      }
    }

    // Check arrays
    if (currentSchema.items) {
      if (currentSchema.items.discriminator) {
        return { schema: currentSchema.items, path: [...currentPath, 'items'] };
      }
      const result = searchSchema(currentSchema.items, [
        ...currentPath,
        'items',
      ]);
      if (result) return result;
    }

    // Check oneOf/anyOf
    if (currentSchema.oneOf || currentSchema.anyOf) {
      const branches = currentSchema.oneOf || currentSchema.anyOf || [];
      for (let i = 0; i < branches.length; i++) {
        if (branches[i].discriminator) {
          return {
            schema: branches[i],
            path: [
              ...currentPath,
              currentSchema.oneOf ? 'oneOf' : 'anyOf',
              i.toString(),
            ],
          };
        }
        const result = searchSchema(branches[i], [
          ...currentPath,
          currentSchema.oneOf ? 'oneOf' : 'anyOf',
          i.toString(),
        ]);
        if (result) return result;
      }
    }

    return null;
  };

  return searchSchema(schema);
};

// Get the discriminator property name
export const getDiscriminatorProperty = (schema: any): string | undefined => {
  return schema.discriminator?.propertyName;
};

// Get the discriminator value from form data
export const getDiscriminatorValue = (
  formData: any,
  schemaPath: string[],
  discriminatorProperty: string,
): string | undefined => {
  return _.get(formData, schemaPath.concat(discriminatorProperty));
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
export const deDuplicateErrors = (errors: any[]): any[] => {
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
