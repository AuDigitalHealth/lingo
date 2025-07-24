///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import Ajv, { ErrorObject } from 'ajv';
import addErrors from 'ajv-errors';
import _ from 'lodash';
import {
  deDuplicateErrors,
  findDiscriminatorSchema,
  getDiscriminatorProperty,
  getDiscriminatorValue,
  removeNullFields,
} from './validationHelper';
import { isEmptyObject } from './helpers';

// Interface to hold discriminator context for recursive processing
interface DiscriminatorContext {
  schema: any;
  path: string[];
  discriminatorProperty: string | undefined; // Allow undefined
  discriminatorValue: string | undefined;
  matchingBranch: any;
}

// Recursively collect required properties from a schema, including nested arrays and objects
const collectRequiredProperties = (
  schema: any,
  path: string[] = [],
): string[] => {
  const requiredProps: string[] = [];

  // Add top-level required properties
  if (schema.required) {
    requiredProps.push(
      ...schema.required.map((prop: string) =>
        path.length > 0 ? `${path.join('.')}.${prop}` : prop,
      ),
    );
  }

  // Traverse properties
  if (schema.properties) {
    Object.entries(schema.properties).forEach(
      ([propName, propSchema]: [string, any]) => {
        const newPath = [...path, propName];
        // Handle nested objects
        if (propSchema.properties) {
          requiredProps.push(...collectRequiredProperties(propSchema, newPath));
        }
        // Handle arrays with items that have properties
        if (propSchema.items?.properties) {
          const arrayPath = [...path, propName, '[*]'];
          requiredProps.push(
            ...collectRequiredProperties(propSchema.items, arrayPath),
          );
        }
        // Handle oneOf/anyOf in properties
        if (propSchema.oneOf || propSchema.anyOf) {
          if (propSchema.required) {
            requiredProps.push(
              ...propSchema.required.map(
                (prop: string) => `${newPath.join('.')}.${prop}`,
              ),
            );
          }
        }
      },
    );
  }

  // Handle oneOf/anyOf schemas
  if (schema.oneOf || schema.anyOf) {
    const branches = schema.oneOf || schema.anyOf || [];
    branches.forEach((branch: any) => {
      requiredProps.push(...collectRequiredProperties(branch, path));
    });
  }

  return [...new Set(requiredProps)];
};

// Enhanced transformErrors to handle nested oneOf/anyOf and discriminators
export const customTransformErrors = (
  errors: ErrorObject[],
  formData: any,
  schema: any,
): ErrorObject[] => {
  const emptyPathErrors = errors.filter(
    e =>
      !e.instancePath &&
      e.keyword !== 'discriminator' &&
      e.keyword !== 'additionalProperties',
  );
  if (emptyPathErrors.length > 0) {
    console.log(
      'Errors with empty instancePath:',
      JSON.stringify(emptyPathErrors, null, 2),
    );
  }

  if (!schema || typeof schema !== 'object') {
    return errors
      .filter(error => error.instancePath || error.keyword === 'discriminator')
      .map(error => ({
        ...error,
        property: error.instancePath
          ? `.${error.instancePath.replace(/\//g, '.')}`
          : '',
        message: error.message || 'Validation error',
        stack: error.message || 'Validation error',
      }));
  }

  // Build discriminator contexts recursively
  const discriminatorContexts: DiscriminatorContext[] = [];
  const buildDiscriminatorContexts = (
    currentSchema: any,
    currentFormData: any,
    path: string[] = [],
  ) => {
    const discriminatorInfo = findDiscriminatorSchema(currentSchema, schema);
    if (discriminatorInfo) {
      const { schema: discriminatorSchema, path: schemaPath } =
        discriminatorInfo;
      const discriminatorProperty =
        getDiscriminatorProperty(discriminatorSchema);
      if (discriminatorProperty) {
        const discriminatorValue = getDiscriminatorValue(
          currentFormData,
          schemaPath,
          discriminatorProperty,
        );
        const branches =
          discriminatorSchema.oneOf || discriminatorSchema.anyOf || [];
        const matchingBranch = branches.find(
          (branch: any) =>
            branch.properties?.[discriminatorProperty]?.const ===
            discriminatorValue,
        );
        discriminatorContexts.push({
          schema: discriminatorSchema,
          path: schemaPath,
          discriminatorProperty,
          discriminatorValue,
          matchingBranch,
        });

        // Recursively check for nested discriminators
        if (matchingBranch && currentFormData) {
          Object.entries(matchingBranch.properties || {}).forEach(
            ([propName, propSchema]: [string, any]) => {
              if (propSchema.items?.properties) {
                const arrayData = _.get(currentFormData, propName);
                if (Array.isArray(arrayData)) {
                  arrayData.forEach((item: any, index: number) => {
                    Object.entries(propSchema.items.properties).forEach(
                      ([subPropName, subPropSchema]) => {
                        if (subPropSchema.discriminator) {
                          buildDiscriminatorContexts(
                            subPropSchema,
                            _.get(item, subPropName),
                            [...path, propName, index.toString(), subPropName],
                          );
                        }
                      },
                    );
                    buildDiscriminatorContexts(propSchema.items, item, [
                      ...path,
                      propName,
                      index.toString(),
                    ]);
                  });
                }
              } else if (propSchema.discriminator) {
                buildDiscriminatorContexts(
                  propSchema,
                  _.get(currentFormData, propName),
                  [...path, propName],
                );
              }
            },
          );
        }
      }
    }
  };

  buildDiscriminatorContexts(schema, formData);

  // Find the relevant context for each error
  const getContextForError = (
    error: ErrorObject,
  ): DiscriminatorContext | undefined => {
    return discriminatorContexts.find(context => {
      const contextPath =
        context.path.length > 0 ? `/${context.path.join('/')}` : '';
      return (
        error.instancePath === contextPath ||
        error.instancePath.startsWith(`${contextPath}/`) ||
        (error.keyword === 'discriminator' &&
          error.schemaPath.includes(contextPath)) ||
        (error.keyword === 'additionalProperties' &&
          error.instancePath === contextPath)
      );
    });
  };

  return deDuplicateErrors(
    errors
      .filter(error => {
        if (error.keyword === 'discriminator') return true;
        if (error.keyword === 'enum') return false; //already handled by discriminator
        if (error.keyword === 'const') return false;
        if (error.keyword === 'oneOf' && error.schemaPath.includes('oneOf'))
          return false;
        if (error.keyword === 'additionalProperties') return false;
        return true;
      })
      .map(error => {
        const context = getContextForError(error);
        const discriminatorPath =
          context && context.discriminatorProperty
            ? context.path.length > 0
              ? `${context.path.join('.')}.${context.discriminatorProperty}`
              : context.discriminatorProperty
            : '';

        const newError: ErrorObject = {
          ...error,
          property: error.instancePath
            ? `.${error.instancePath.replace(/^\//, '').replace(/\//g, '.')}`
            : discriminatorPath && error.keyword === 'discriminator'
              ? `.${discriminatorPath}`
              : '',
          message: error.message || 'Validation error',
          stack: '',
        };

        if (error.keyword === 'required') {
          const missingProperty = error.params?.missingProperty;
          newError.property = newError.property
            ? `${newError.property}.${missingProperty}`
            : `.${missingProperty}`;
          newError.instancePath = newError.instancePath
            ? `${newError.instancePath}/${missingProperty}`
            : `/${missingProperty}`;
          newError.message = 'Field must be populated';
          newError.stack = `${newError.message} "${missingProperty}" (at ${newError.property})`;
        } else if (
          (error.keyword === 'type' && error.data === null) ||
          (error.keyword === 'minProperties' && isEmptyObject(error.data))
        ) {
          newError.message = 'Field must be populated';
          newError.stack = `${newError.message} (at ${newError.property})`;
        } else if (error.keyword === 'additionalProperties') {
          const invalidProperty = error.params?.additionalProperty;
          newError.property = newError.property
            ? `${newError.property}.${invalidProperty}`
            : `.${invalidProperty}`;
          newError.message = `Invalid field ${invalidProperty}${context ? ` for ${context.discriminatorProperty || 'discriminator'}=${context.discriminatorValue || 'undefined'}` : ''}`;
          newError.stack = `${newError.message} (at ${newError.property})`;
        } else if (error.keyword === 'enum') {
          newError.message = 'Please select a valid option';
          newError.stack = `${newError.message} (at ${newError.property})`;
        } else if (error.keyword === 'discriminator') {
          newError.property = `.${discriminatorPath}`;
          newError.message = `Invalid ${context?.discriminatorProperty || 'discriminator'}: ${context?.discriminatorValue || 'undefined'}`;
          newError.stack = newError.message;
        } else if (error.keyword === 'pattern') {
          newError.message =
            error.schema?.errorMessage?.pattern || 'Invalid format';
          newError.stack = `${newError.message} (at ${newError.property})`;
        } else if (error.keyword === 'minItems') {
          newError.message = 'At least one item is required';
          newError.stack = `${newError.message} (at ${newError.property})`;
        } else {
          newError.stack = `${newError.message} (at ${newError.property})`;
        }

        return newError;
      }),
  );
};

// Create validator
export const validator = (() => {
  const ajvMain = new Ajv({
    allErrors: true,
    strict: false,
    $data: true,
    discriminator: true,
    verbose: true,
  });
  addErrors(ajvMain);

  const ajvIsValid = new Ajv({
    allErrors: false,
    strict: false,
    $data: true,
    discriminator: true,
  });

  return {
    validateFormData: (formData: any, schema: any) => {
      const cleanedFormData = removeNullFields(formData);
      const now = new Date().toISOString();
      schema.$id = `${formData.variant}-${now}`;
      const validate = ajvMain.compile(schema);
      const valid = validate(cleanedFormData);

      const errors = customTransformErrors(
        validate.errors || [],
        cleanedFormData,
        schema,
      );

      const errorSchema = errors.reduce((acc: any, error: ErrorObject) => {
        let path = error.property ? error.property.replace(/^\./, '') : '';
        if (error.keyword === 'discriminator') {
          const context = findDiscriminatorSchema(schema, schema);
          if (
            context &&
            context.schema.discriminator &&
            context.schema.discriminator.propertyName
          ) {
            path =
              context.path.length > 0
                ? `${context.path.join('.')}.${context.schema.discriminator.propertyName}`
                : context.schema.discriminator.propertyName;
          } else {
            console.warn('Discriminator context missing or invalid:', context);
            path = ''; // Fallback to root-level error
          }
        }
        if (path) {
          _.set(acc, path, { __errors: [error.message || 'Validation error'] });
        } else {
          acc.__errors = acc.__errors || [];
          acc.__errors.push(error.message || 'Validation error');
        }
        return acc;
      }, {});

      return { errors, formData: cleanedFormData, errorSchema };
    },
    isValid: (schema: any, formData: any, rootSchema: any) => {
      const schemaCopy = { ...schema };
      delete schemaCopy.$id;
      const cleanedFormData = removeNullFields(formData);
      try {
        const validate = ajvIsValid.compile(schemaCopy);
        return validate(cleanedFormData) === true;
      } catch (e) {
        console.error('isValid compilation error:', e);
        return false;
      }
    },
    toErrorList: (errorSchema: any, fieldName: string = 'root') => {
      const errors: any[] = [];
      const extractErrors = (obj: any, path: string = '') => {
        for (const key in obj) {
          if (key === '__errors') {
            obj[key].forEach((message: string) => {
              const instancePath = path ? `/${path.replace(/\./g, '/')}` : '';
              errors.push({
                message,
                stack: message,
                instancePath,
                property: path ? `.${path}` : '',
              });
            });
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            const newPath = path ? `${path}.${key}` : key;
            extractErrors(obj[key], newPath);
          }
        }
      };
      extractErrors(errorSchema);
      return errors;
    },
    transformErrors: (errors: ErrorObject[], formData: any, schema: any) =>
      customTransformErrors(errors, formData, schema),
  };
})();
