import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { Grid, TextField, Typography, Box } from '@mui/material';
import _ from 'lodash';
import { UnitEachId } from '../../../../utils/helpers/conceptUtils.ts';
import { getParentPath, getUiSchemaPath } from "../helpers/helpers.ts";
import EclAutocomplete from "../components/EclAutocomplete.tsx";
import useTaskById from "../../../../hooks/useTaskById.tsx";
import { Task } from "../../../../types/task.ts";

const CompactQuantityWidget = ({
                                   value: formData, // formData is the entire object { value, unit }
                                   onChange,
                                   schema,
                                   uiSchema,
                                   idSchema,
                                   required,
                                   formContext,
                                   rawErrors = [],
                                   registry,
                                   name,
                                   disabled,
                                   readonly,
                               }: WidgetProps) => {
    const task = useTaskById();

    // Extract data for main (numerator) field
    const mainValue = _.get(formData, 'value', undefined);
    const mainUnit = _.get(formData, 'unit', undefined);
    const title = _.get(uiSchema, 'ui:title', 'Quantity');
    const unitOptions = _.get(uiSchema, 'unit.ui:options', {});
    const isNumerator = _.get(uiSchema, 'ui:options.isNumerator', false);
    const pairWith = _.get(uiSchema, 'ui:options.pairWith', null);

    // Calculate field paths
    const rootFormData = _.get(registry, 'formContext.formData', {});
    const fieldNameRaw = idSchema?.$id ? idSchema.$id.replace('root_', '') : undefined;
    const fieldName = fieldNameRaw?.replace(/_(\d+)_/g, '[$1].') || name;
    const pairedField = pairWith ? `${getParentPath(fieldName)}.${pairWith}` : undefined;

    // Extract data for paired (denominator) field
    const pairedFormData = pairedField && isNumerator ? _.get(rootFormData, pairedField, {}) : {};
    const pairedValue = _.get(pairedFormData, 'value', '');
    const pairedUnit = _.get(pairedFormData, 'unit', undefined);

    // Get ui:options and schema for paired field's unit
    const pairedUiSchemaPath = `${getUiSchemaPath(getParentPath(fieldName))}.${pairWith}`;
    const pairedUnitUiOptions = _.get(formContext.uiSchema, `${pairedUiSchemaPath}.unit.ui:options`, {});
    const pairedSchemaPath = pairedField?.split('.').map(part => part.replace(/\[\d+\]/, '.items')).join('.');
    const pairedUnitSchema = _.get(registry.rootSchema, `${pairedSchemaPath}.properties.unit`, {});

    // Utility function to adjust value based on unit
    const adjustValue = (value: number | undefined, unit: any): number => {
        const isEach = _.get(unit, 'conceptId') === UnitEachId;
        return isEach ? Math.max(1, Math.round(value || 0)) : (value || 0);
    };

    // Handler for value changes
    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>, isPair = false) => {
        const numericValue = parseFloat(event.target.value);
        if (isNaN(numericValue)) return;

        const targetUnit = isPair ? pairedUnit : mainUnit;
        const adjustedValue = adjustValue(numericValue, targetUnit);
        const targetField = isPair ? pairedField : fieldName;
        const targetData = isPair ? pairedFormData : formData || {};
        const updatedFormData = { ...targetData, value: adjustedValue };

        if (isPair) {
            const newFormData = _.cloneDeep(rootFormData);
            _.set(newFormData, targetField, updatedFormData);
            formContext.onChange(newFormData); // Update the entire form data for paired field
        } else {
            onChange(updatedFormData); // Update only this widget's value
        }
    };

    // Handler for unit changes
    const handleUnitChange = (selectedUnit: any | null, isPair = false) => {
        const targetField = isPair ? pairedField : fieldName;
        const targetData = isPair ? pairedFormData : formData || {};
        const newFormData = _.cloneDeep(rootFormData);

        if (!selectedUnit) {
            const updatedFormData = { ...targetData };
            delete updatedFormData.unit;
            delete updatedFormData.value;
            if (isPair) {
                _.set(newFormData, targetField, updatedFormData);
                formContext.onChange(newFormData);
            } else {
                onChange(updatedFormData);
            }
        } else {
            const currentValue = isPair ? pairedValue : mainValue;
            const adjustedValue = adjustValue(currentValue, selectedUnit);
            const updatedFormData = { ...targetData, unit: selectedUnit, value: adjustedValue };
            if (isPair) {
                _.set(newFormData, targetField, updatedFormData);
                formContext.onChange(newFormData);
            } else {
                onChange(updatedFormData);
            }
        }
    };

    const renderQuantityField = ({
                                     label,
                                     value,
                                     unit,
                                     onValueChange,
                                     onUnitChange,
                                     unitSchema,
                                     uiOptions,
                                     idPrefix,
                                     required,
                                     errors,
                                     task,
                                 }: {
        label: string;
        value: any;
        unit: any;
        onValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onUnitChange: (val: any) => void;
        unitSchema: any;
        uiOptions: any;
        idPrefix: string;
        required: boolean;
        errors: string[];
        task: Task;
    }) => (
        <Grid container spacing={0.5} alignItems="center">
            <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {label}
                </Typography>
            </Grid>
            <Grid item xs={5}>
                <TextField
                    id={`${idPrefix}-value`}
                    value={value ?? ''}
                    onChange={onValueChange}
                    type="number"
                    fullWidth
                    variant="outlined"
                    size="small"
                    required={required}
                    error={errors.length > 0}
                    helperText={errors.length > 0 ? errors.join(', ') : ''}
                    disabled={disabled || readonly}
                    inputProps={{
                        min: _.get(unit, 'conceptId') === UnitEachId ? 1 : 0,
                        step: _.get(unit, 'conceptId') === UnitEachId ? 1 : 0.01,
                        style: { padding: '4px 8px' },
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { height: '32px' } }}
                />
            </Grid>
            <Grid item xs={5}>
                {task && (
                    <EclAutocomplete
                        value={unit}
                        onChange={onUnitChange}
                        ecl={uiOptions.ecl || ''}
                        branch={task.branchPath}
                        showDefaultOptions={uiOptions.showDefaultOptions || true}
                        isDisabled={disabled || readonly}
                        title="Unit"
                        errorMessage={errors.length > 0 ? errors.join(', ') : ''}
                    />
                )}
            </Grid>
        </Grid>
    );

    if (!isNumerator && pairWith) return null;

    return (
        <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                {title}
            </Typography>
            <Grid container spacing={0.5} alignItems="center">
                <Grid item xs={12}>
                    {renderQuantityField({
                        label: 'Numerator',
                        value: mainValue,
                        unit: mainUnit,
                        onValueChange: (e) => handleValueChange(e, false),
                        onUnitChange: (val) => handleUnitChange(val, false),
                        unitSchema: _.get(schema, 'properties.unit', {}),
                        uiOptions: unitOptions,
                        idPrefix: idSchema.$id,
                        required,
                        errors: rawErrors,
                        task,
                    })}
                </Grid>
                {pairWith && (
                    <Grid item xs={12}>
                        {renderQuantityField({
                            label: 'Denominator',
                            value: pairedValue,
                            unit: pairedUnit,
                            onValueChange: (e) => handleValueChange(e, true),
                            onUnitChange: (val) => handleUnitChange(val, true),
                            unitSchema: pairedUnitSchema,
                            uiOptions: pairedUnitUiOptions,
                            idPrefix: `${idSchema.$id}-${pairWith}`,
                            required,
                            errors: [],
                            task,
                        })}
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default CompactQuantityWidget;