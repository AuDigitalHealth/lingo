// src/utils/errorUtils.ts

import _ from 'lodash';
interface ErrorOptions {
  prefix?: string; // Optional prefix for rawErrors
}

export const getUniqueErrors = (
  rawErrors: string[] = [],
  errorSchema: any = {},
  options: ErrorOptions = {},
): string[] => {
  if (rawErrors.length > 0) {
    return rawErrors;
  }
  const { prefix } = options;

  // Initialize Set with rawErrors, optionally prefixed
  const errorsSet = new Set<string>(
    prefix ? rawErrors.map(error => `${prefix}: ${error}`) : rawErrors,
  );

  // Add errors from errorSchema
  const schemaErrors = extractAllErrorMessages(errorSchema);
  schemaErrors.forEach(error => errorsSet.add(error));
  return Array.from(errorsSet);
};

export const extractAllErrorMessages = (
  errorSchema: any,
  parentPath: string = '',
): string[] => {
  let errors: string[] = [];

  // Add top-level errors if they exist, prefixed with the current path
  if (errorSchema.__errors && Array.isArray(errorSchema.__errors)) {
    const currentPath = parentPath ? parentPath : undefined;
    errors = errors.concat(
      errorSchema.__errors.map((error: string) => {
        if(currentPath){
          return `${currentPath}: ${error}`;
        }
        else{
          return `${error}`;
        }

      }),
    );
  }

  // Recursively extract errors from nested properties
  for (const key in errorSchema) {
    if (
      key !== '__errors' &&
      errorSchema[key] &&
      typeof errorSchema[key] === 'object'
    ) {
      // Build the new path by appending the current key
      const newPath = parentPath ? `${parentPath}.${key}` : key;
      errors = errors.concat(
        extractAllErrorMessages(errorSchema[key], newPath),
      );
    }
  }

  return errors;
};

export const getFieldErrors = (
  errorSchema: any,
  fieldPath: string,
): string[] => {
  const fieldErrors = _.get(errorSchema, fieldPath) || {};
  return extractAllErrorMessages(fieldErrors);
};
