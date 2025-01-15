// validation.ts
import { customizeValidator } from '@rjsf/validator-ajv8';
import ajvKeywords from 'ajv-keywords';

// Add custom validation for mutually exclusive fields
export const addMutuallyExclusiveFieldsValidator = (ajv: any) => {
    ajv.addKeyword('mutuallyExclusiveFields', {
        validate: (schema, data) => {
            const mutuallyExclusiveFields = schema?.mutuallyExclusiveFields || [];
            return !mutuallyExclusiveFields.some(([field1, field2]) => data[field1] && data[field2]);
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
        if (['minProperties', 'required', 'isNonEmptyObject'].includes(error.name)) {
            error.message = 'This field cannot be left blank.';
        }
        if (error.name === 'mutuallyExclusiveFields') {
            error.message = 'Only one of containerType or deviceType can be selected.';
        }
        return error;
    });
};
