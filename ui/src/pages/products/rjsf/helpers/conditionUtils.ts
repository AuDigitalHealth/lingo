import { get } from 'lodash';

// Define a type for a single condition
export interface Condition {
    field: string; // The field to check in formData
    operator: 'lengthGreaterThan' | 'equals' | 'notEquals' | 'exists' | 'notExists';
    value?: any; // The value to compare against (optional for exists/notExists)
}

// Evaluate a single condition
const evaluateCondition = (formData: any, condition: Condition): boolean => {
    const { field, operator, value } = condition;
    const dependentFieldValue = get(formData, field);

    switch (operator) {
        case 'lengthGreaterThan':
            return Array.isArray(dependentFieldValue) && dependentFieldValue.length > (value ?? 0);
        case 'equals':
            return dependentFieldValue === value;
        case 'notEquals':
            return dependentFieldValue !== value;
        case 'exists':
            return dependentFieldValue !== undefined && dependentFieldValue !== null;
        case 'notExists':
            return dependentFieldValue === undefined || dependentFieldValue === null;
        default:
            console.warn(`Unsupported operator: ${operator}`);
            return false;
    }
};

// Main function to check conditions
export const shouldHideField = (
    formData: any,
    conditions: Condition[] = [],
    conditionLogic: 'and' | 'or' = 'and'
): boolean => {
    let hideField: boolean;
    if (conditions.length === 0) {
        hideField = false; // No conditions means show the field
    } else if (conditionLogic === 'and') {
        hideField = conditions.every((condition) => evaluateCondition(formData,condition));
    } else {
        // 'or' logic
        hideField = conditions.some((condition) => evaluateCondition(formData,condition));
    }
    return hideField;
};