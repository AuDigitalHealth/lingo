import _, { cloneDeep, get, set } from 'lodash';

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

export function resetDiscriminators(
  schema: any,
  formData: any,
  uiSchema: any = {},
) {
  const updatedData = cloneDeep(formData);

  function getUiSchemaPath(rootUiSchema: any, path: string[]): any {
    let current = rootUiSchema;

    for (const key of path) {
      if (!current) {
        return undefined;
      }
      if (!isNaN(Number(key))) {
        current = current.items || current;
      } else {
        current = current[key] || current.items?.[key] || current;
      }
    }
    return current;
  }

  function walk(
    schemaNode: any,
    dataNode: any,
    path: string[] = [],
    rootSchema: any = schema,
    rootUiSchema: any = uiSchema,
  ) {
    if (!schemaNode || typeof schemaNode !== 'object') {
      return;
    }

    // Resolve $ref
    if (schemaNode.$ref) {
      const resolved = resolveRef(rootSchema, schemaNode.$ref);
      walk(resolved, dataNode, path, rootSchema, rootUiSchema);
      return;
    }

    const discriminator = schemaNode.discriminator?.propertyName;
    const variants = schemaNode.oneOf || schemaNode.anyOf;

    if (discriminator && variants) {
      const discriminatorValue = get(dataNode, discriminator);

      // Get uiSchema for current path
      const uiSchemaPath = getUiSchemaPath(rootUiSchema, path);
      const dynamicOptions =
        uiSchemaPath?.[discriminator]?.['ui:options']
          ?.dynamicDiscriminatorOptions;

      // Find matching variant
      let match = variants.find(
        (variant: any) =>
          get(variant, ['properties', discriminator, 'const']) ===
          discriminatorValue,
      );

      // Validate against dynamicDiscriminatorOptions
      let defaultValue: string | undefined;
      if (
        dynamicOptions &&
        dynamicOptions.path !== undefined &&
        dynamicOptions.options
      ) {
        const parentPath =
          dynamicOptions.path.replace(/^\//, '').replace(/\//g, '.') ||
          discriminator;
        const parentValue =
          parentPath === discriminator
            ? discriminatorValue
            : get(updatedData, parentPath);
        const validOptions = dynamicOptions.options[parentValue] || [];
        const validValues = validOptions.map((opt: any) => opt.value);

        if (!validValues.includes(discriminatorValue)) {
          defaultValue =
            validOptions[0]?.value ||
            schemaNode.properties?.[discriminator]?.default;
          if (defaultValue !== undefined) {
            set(updatedData, [...path, discriminator], defaultValue);
            if (schemaNode.properties?.oneOf_select) {
              set(updatedData, [...path, 'oneOf_select'], defaultValue);
            }
          }
        }
        match = variants.find(
          (variant: any) =>
            get(variant, ['properties', discriminator, 'const']) ===
            (defaultValue || discriminatorValue),
        );
      } else if (!match) {
        // Fallback to schema-based reset
        const defaultVariant = variants.find(
          (variant: any) =>
            'default' in (get(variant, ['properties', discriminator]) || {}),
        );
        defaultValue =
          get(defaultVariant, ['properties', discriminator, 'default']) ??
          variants.find((v: any) =>
            get(v, ['properties', discriminator, 'const']),
          )?.properties?.[discriminator]?.const;

        if (defaultValue !== undefined) {
          set(updatedData, [...path, discriminator], defaultValue);
          if (schemaNode.properties?.oneOf_select) {
            set(updatedData, [...path, 'oneOf_select'], defaultValue);
          }
        }
      }

      // Use the active schema
      const activeSchema =
        match ||
        variants.find(
          (v: any) => 'default' in (v.properties?.[discriminator] || {}),
        );

      if (activeSchema) {
        // Explicitly set 'type' to root 'variant' value in productDetails
        if (
          path[0] === 'containedProducts' &&
          path[2] === 'productDetails' &&
          activeSchema.properties?.type
        ) {
          const variantValue = get(updatedData, ['variant']);
          if (variantValue) {
            set(updatedData, [...path, 'type'], variantValue);
          }
        }

        // Set other constant fields
        Object.entries(activeSchema.properties || {}).forEach(
          ([key, subschema]) => {
            if (subschema.const && !get(dataNode, key) && key !== 'type') {
              set(updatedData, [...path, key], subschema.const);
            }
          },
        );

        // Process nested properties
        Object.entries(activeSchema.properties || {}).forEach(
          ([key, subschema]) => {
            if (key !== discriminator) {
              const resolvedSubschema = subschema.$ref
                ? resolveRef(rootSchema, subschema.$ref)
                : subschema;

              walk(
                resolvedSubschema,
                get(dataNode, key),
                [...path, key],
                rootSchema,
                rootUiSchema,
              );
            }
          },
        );

        if (activeSchema.oneOf || activeSchema.anyOf) {
          const branches = activeSchema.oneOf || activeSchema.anyOf;

          branches.forEach((branch: any, index: number) => {
            const branchData = dataNode;
            const resolvedBranch = branch.$ref
              ? resolveRef(rootSchema, branch.$ref)
              : branch;
            walk(
              resolvedBranch,
              branchData,
              [
                ...path,
                activeSchema.oneOf ? 'oneOf' : 'anyOf',
                index.toString(),
              ],
              rootSchema,
              rootUiSchema,
            );
          });
        }
      }
    }

    // Handle objects
    if (schemaNode.type === 'object' && schemaNode.properties) {
      for (const [key, subschema] of Object.entries(schemaNode.properties)) {
        const resolvedSubschema = subschema.$ref
          ? resolveRef(rootSchema, subschema.$ref)
          : subschema;

        walk(
          resolvedSubschema,
          get(dataNode, key),
          [...path, key],
          rootSchema,
          rootUiSchema,
        );
      }
    }

    // Handle arrays
    if (schemaNode.type === 'array' && schemaNode.items) {
      const items = get(dataNode, path) || [];
      const resolvedItems = schemaNode.items.$ref
        ? resolveRef(rootSchema, schemaNode.items.$ref)
        : schemaNode.items;
      const uiSchemaItems = getUiSchemaPath(rootUiSchema, path)?.items;

      items.forEach((item: any, idx: number) => {
        walk(
          resolvedItems,
          item,
          [...path, idx.toString()],
          rootSchema,
          uiSchemaItems || rootUiSchema,
        );
      });
    }

    // Handle oneOf/anyOf (outside discriminator context)
    if (schemaNode.oneOf || schemaNode.anyOf) {
      const branches = schemaNode.oneOf || schemaNode.anyOf;

      branches.forEach((branch: any, index: number) => {
        const resolvedBranch = branch.$ref
          ? resolveRef(rootSchema, branch.$ref)
          : branch;
        walk(
          resolvedBranch,
          dataNode,
          [...path, schemaNode.oneOf ? 'oneOf' : 'anyOf', index.toString()],
          rootSchema,
          rootUiSchema,
        );
      });
    }
  }

  // Process top-level discriminator
  walk(schema, updatedData, [], schema, uiSchema);

  // Explicitly reset nested productType discriminators
  const variant = get(updatedData, 'variant');
  if (variant) {
    const containedProducts = get(updatedData, 'containedProducts') || [];
    containedProducts.forEach((_: any, idx: number) => {
      const productDetailsSchema = schema.oneOf?.find(
        (branch: any) =>
          get(branch, ['properties', 'variant', 'const']) === variant,
      )?.properties?.containedProducts?.items?.properties?.productDetails;
      if (productDetailsSchema) {
        const productDetailsPath = [
          'containedProducts',
          idx.toString(),
          'productDetails',
        ];
        walk(
          productDetailsSchema,
          get(updatedData, productDetailsPath),
          productDetailsPath,
          schema,
          getUiSchemaPath(uiSchema, [
            'containedProducts',
            'items',
            'productDetails',
          ]),
        );
      }
    });
  }

  return updatedData;
}
