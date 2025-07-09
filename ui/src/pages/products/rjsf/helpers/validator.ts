import Ajv, { ErrorObject } from 'ajv';
import addErrors from 'ajv-errors';
import _ from 'lodash';
import { findDiscriminatorSchema, getDiscriminatorProperty, getDiscriminatorValue } from './validationHelper';
import { isEmptyObject } from './helpers';

// Enhanced transformErrors to preserve instancePath and ensure rawErrors compatibility
export const customTransformErrors = (errors: ErrorObject[], formData: any, schema: any): ErrorObject[] => {
    console.log('transformErrors was called', JSON.stringify(errors, null, 2));
    // Log errors with empty instancePath for debugging
    const emptyPathErrors = errors.filter(e => !e.instancePath && e.keyword !== 'discriminator');
    if (emptyPathErrors.length > 0) {
        console.log('Errors with empty instancePath:', JSON.stringify(emptyPathErrors, null, 2));
    }

    if (!schema || typeof schema !== 'object') {
        return errors
            .filter((error) => error.instancePath) // Only include errors with instancePath for fields
            .map((error) => ({
                ...error,
                property: `.${error.instancePath.replace(/\//g, '.')}`,
                stack: error.message || 'Validation error'
            }));
    }

    const discriminatorInfo = findDiscriminatorSchema(schema, schema);
    if (!discriminatorInfo) {
        return errors
            .filter((error) => error.instancePath)
            .map((error) => ({
                ...error,
                property: `.${error.instancePath.replace(/\//g, '.')}`,
                stack: error.message || 'Validation error'
            }));
    }

    const { schema: discriminatorSchema, path: schemaPath } = discriminatorInfo;
    const discriminatorProperty = getDiscriminatorProperty(discriminatorSchema);
    if (!discriminatorProperty) {
        return errors
            .filter((error) => error.instancePath)
            .map((error) => ({
                ...error,
                property: `.${error.instancePath.replace(/\//g, '.')}`,
                stack: error.message || 'Validation error'
            }));
    }

    const discriminatorValue = getDiscriminatorValue(formData, schemaPath, discriminatorProperty);
    const discriminatorPath = schemaPath.join('.') + (schemaPath.length ? '.' : '') + discriminatorProperty;

    if (!discriminatorValue) {
        console.debug(`No discriminator value for ${discriminatorProperty} at ${discriminatorPath}`);
        return errors
            .filter((error) => error.keyword !== 'oneOf' && error.keyword !== 'additionalProperties' && error.instancePath)
            .map((error) => ({
                ...error,
                property: `.${error.instancePath.replace(/\//g, '.')}`,
                stack: error.message || 'Validation error'
            }));
    }

    const branches = discriminatorSchema.oneOf || discriminatorSchema.anyOf || [];
    const matchingBranch = branches.find(
        (branch: any) => branch.properties?.[discriminatorProperty]?.const === discriminatorValue
    );

    if (!matchingBranch) {
        console.debug(`No matching branch for ${discriminatorProperty}=${discriminatorValue}`);
        return errors
            .filter((error) => error.instancePath || error.keyword === 'discriminator')
            .map((error) => ({
                ...error,
                property: error.instancePath ? `.${error.instancePath.replace(/\//g, '.')}` : '',
                message: error.keyword === 'discriminator' ? `Invalid ${discriminatorProperty}: ${discriminatorValue || 'undefined'}` : error.message || 'Validation error',
                stack: error.message || 'Validation error'
            }));
    }

    const validProperties = Object.keys(matchingBranch.properties || {});
    return errors
        .filter((error) => {
            if (error.keyword === 'discriminator') return true;
            // if (error.keyword === 'oneOf') return false;
            // if (error.keyword === 'required') {
            //     return validProperties.includes(error.params?.missingProperty) && error.instancePath;
            // }
            if (error.keyword === 'additionalProperties') {
                // return !validProperties.includes(error.params?.additionalProperty) && error.instancePath;
                return false;
            }
            return error.instancePath; // Only include errors with instancePath for fields
        })
        .map((error) => {
            const isRelatedToDiscriminator = error.instancePath && error.instancePath.includes(discriminatorPath.replace(/\.\d+\./g, '/'));
            const newError: ErrorObject = {
                ...error,
                property: error.instancePath
                    ? '.' + error.instancePath.replace(/^\//, '').replace(/\//g, '.')
                    : '',
                stack:''
            };



            if (error.keyword === 'required') {
                newError.message = 'Field must be populated:';
                newError.stack = `${newError.message} "${newError.params?.missingProperty}" ( at ${newError.property})`
            } else if ((error.keyword === 'type' && error.data === null) || (error.keyword === 'minProperties' && isEmptyObject(error.data))) {
                newError.message = `Field must be populated`;
            } else if (error.keyword === 'additionalProperties' && isRelatedToDiscriminator) {
                newError.message = `Invalid field ${error.params.additionalProperty} for ${discriminatorValue}`;
            } else if (error.keyword === 'enum') {
                newError.message = 'Please select a valid option';
            } else if (error.keyword === 'discriminator') {
                newError.message = `Invalid ${discriminatorProperty}: ${discriminatorValue || 'undefined'}`;
            }
            if(!newError.stack){
                newError.stack = `${newError.message}: (at ${newError.property})`
            }

            return newError;
        });
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
            const validate = ajvMain.compile(schema);
            const valid = validate(formData);
            const errors = customTransformErrors(validate.errors || [], formData, schema);
            console.log('validateFormData errors:', JSON.stringify(errors, null, 2));
            // Construct errorSchema to ensure rawErrors is populated
            const errorSchema = errors.reduce((acc: any, error: any) => {
                const path = error.instancePath ? error.instancePath.replace(/^\//, '').replace(/\//g, '.') : null;
                if (path) {
                    _.set(acc, path, { __errors: [error.message || 'Validation error'] });
                } else {
                    acc.__errors = acc.__errors || [];
                    acc.__errors.push(error.message || 'Validation error');
                }
                return acc;
            }, {});
            console.log('validateFormData errorSchema:', JSON.stringify(errorSchema, null, 2));
            return { errors, formData, errorSchema };
        },
        isValid: (schema: any, formData: any, rootSchema: any) => {
            const schemaCopy = { ...schema };
            delete schemaCopy.$id;
            try {
                const validate = ajvIsValid.compile(schemaCopy);
                return validate(formData) === true;
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
                                property: path ? `.${path}` : ''
                            });
                        });
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        const newPath = path ? `${path}.${key}` : key;
                        extractErrors(obj[key], newPath);
                    }
                }
            };
            extractErrors(errorSchema);
            console.log('toErrorList errors:', JSON.stringify(errors, null, 2));
            return errors;
        },
        transformErrors: (errors: ErrorObject[], formData: any, schema: any) => customTransformErrors(errors, formData, schema),
    };
})();