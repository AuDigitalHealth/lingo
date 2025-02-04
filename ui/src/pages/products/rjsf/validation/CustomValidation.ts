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

// validation.ts
import { customizeValidator } from '@rjsf/validator-ajv8';
import ajvKeywords from 'ajv-keywords';

// Add custom validation for mutually exclusive fields
export const addMutuallyExclusiveFieldsValidator = (ajv: any) => {
  ajv.addKeyword('mutuallyExclusiveFields', {
    validate: (schema, data) => {
      const mutuallyExclusiveFields = schema?.mutuallyExclusiveFields || [];
      return !mutuallyExclusiveFields.some(
        ([field1, field2]) => data[field1] && data[field2],
      );
    },
    errors: true,
  });
};

// Customize the validator using @rjsf/validator-ajv8
export const createCustomizedValidator = () => {
  const customizedValidator = customizeValidator();
  addMutuallyExclusiveFieldsValidator(customizedValidator.ajv);
  return customizedValidator;
};

// Custom error transformation function
export const transformErrors = (errors: any) => {
  return errors.map((error: any) => {
    if (
      ['minProperties', 'required', 'isNonEmptyObject'].includes(error.name)
    ) {
      error.message = 'This field cannot be left blank.';
    }
    if (error.name === 'mutuallyExclusiveFields') {
      error.message =
        'Only one of containerType or deviceType can be selected.';
    }
    return error;
  });
};
