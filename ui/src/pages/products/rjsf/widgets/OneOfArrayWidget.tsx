import React, { useState, useEffect } from 'react';
import { WidgetProps } from '@rjsf/utils';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  TextField,
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ValueSetAutocomplete from '../components/ValueSetAutocomplete';
import EclAutocomplete from '../components/EclAutocomplete';
import useTaskById from '../../../../hooks/useTaskById.tsx';

const renderField = (
  propName: string,
  propSchema: any,
  value: any,
  onChange: (newValue: any) => void,
  disabled: boolean,
  readonly: boolean,
  valueSetAutocomplete: boolean = false,
  eclAutocomplete: boolean = false,
  scheme: string,
  bindingConfig: any,
  isMandatoryUnfilled: boolean = false, // Indicates if this field is mandatory and unfilled
  submitAttempted: boolean = false, // Indicates submission attempt
  branch: string,
) => {
  if (propSchema.const) {
    return null;
  }

  // Show error if mandatory field is unfilled after submission attempt
  const errorMessage =
    submitAttempted && isMandatoryUnfilled && propName === 'identifierValue'
      ? 'This field is required'
      : propSchema.pattern && !new RegExp(propSchema.pattern).test(value || '')
        ? propSchema.errorMessage?.pattern || 'Invalid format'
        : '';

  if (valueSetAutocomplete) {
    const binding = bindingConfig[scheme] || {};
    return (
      <Box paddingTop={1}>
        <ValueSetAutocomplete
          label={propSchema.title || 'Value'}
          url={binding.valueSet}
          showDefaultOptions={false}
          value={value || null}
          onChange={onChange}
          disabled={disabled || readonly}
          error={errorMessage} // Pass error message
        />
      </Box>
    );
  } else if (eclAutocomplete && branch) {
    const binding = bindingConfig[scheme] || {};
    return (
      <Box paddingTop={1}>
        <EclAutocomplete
          value={value || null}
          ecl={binding.ecl}
          branch={branch}
          onChange={onChange}
          showDefaultOptions={false}
          isDisabled={disabled || readonly}
          errorMessage={errorMessage} // Pass error message
          title={propSchema.title || 'Value'}
        />
      </Box>
    );
  }

  if (propSchema.enum) {
    return (
      <FormControl fullWidth sx={{ mb: 1, mt: 1 }} error={!!errorMessage}>
        <InputLabel>{propSchema.title || propName}</InputLabel>
        <Select
          value={value || propSchema.default || ''}
          onChange={e => onChange(e.target.value)}
          disabled={disabled || readonly}
        >
          {propSchema.enum.map((option: any) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
        {errorMessage && (
          <Typography color="error" variant="caption">
            {errorMessage}
          </Typography>
        )}
      </FormControl>
    );
  }

  return (
    <TextField
      label={propSchema.title || propName}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      fullWidth
      disabled={disabled || readonly}
      error={!!errorMessage}
      helperText={errorMessage}
      sx={{ mb: 1, mt: 1 }}
    />
  );
};

const OneOfArrayWidget: React.FC<WidgetProps> = props => {
  const {
    schema,
    id,
    value,
    onChange,
    required,
    disabled,
    readonly,
    uiSchema,
    rawErrors, // RJSF validation errors
  } = props;

  if (!schema.items || !('oneOf' in schema.items)) {
    console.error(
      'OneOfArrayWidget requires an array with oneOf schema:',
      schema,
    );
    return <div>Error: Expected an array with oneOf schema</div>;
  }
  const task = useTaskById();

  const oneOfOptions = schema.items.oneOf as any[];
  const items = Array.isArray(value) ? value : [];
  const binding = uiSchema['ui:options']?.binding || {};
  const mandatorySchemes = uiSchema['ui:options']?.mandatorySchemes || [];
  const multiValuedSchemes = uiSchema['ui:options']?.multiValuedSchemes || [];
  const skipTitle = uiSchema['ui:options']?.skipTitle;

  const [selectedType] = useState<string>(() => {
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      const lastSchema = oneOfOptions.find(
        option =>
          option.properties.identifierScheme.const ===
          lastItem.identifierScheme,
      );
      return lastSchema?.title || oneOfOptions[0]?.title || '';
    }
    return oneOfOptions[0]?.title || '';
  });
  const [dropdownType, setDropdownType] = useState<string>(selectedType);

  const title = uiSchema['ui:options']?.title || schema.title || 'Items';

  const hasValueSetBinding = (scheme: string) => {
    if (binding[scheme]) {
      return !!binding[scheme].valueSet;
    }
    return false;
  };
  const hasEclBinding = (scheme: string) => {
    if (binding[scheme]) {
      return !!binding[scheme].ecl;
    }
    return false;
  };

  // Detect submission attempt via rawErrors
  const submitAttempted = !!rawErrors?.length;

  useEffect(() => {
    enforceMandatoryConstraints(items);
  }, []);

  const addItem = () => {
    const selectedSchema = oneOfOptions.find(
      option => option.title === dropdownType,
    );
    const scheme = selectedSchema?.properties.identifierScheme.const;
    const isMultiValued = multiValuedSchemes.includes(scheme);

    if (!selectedSchema) return;

    const newItem: any = {};
    Object.entries(selectedSchema.properties).forEach(
      ([key, prop]: [string, any]) => {
        if (prop.const) {
          newItem[key] = prop.const;
        } else if (
          (hasValueSetBinding(scheme) || hasEclBinding(scheme)) &&
          key === 'identifierValue'
        ) {
          newItem[key] = null;
        } else if (prop.default) {
          newItem[key] = prop.default;
        } else {
          newItem[key] = '';
        }
      },
    );

    const newItems = [...items, newItem];
    onChange(newItems);
  };

  const updateItem = (index: number, updated: any) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    enforceMandatoryConstraints(newItems);
  };

  const enforceMandatoryConstraints = (currentItems: any[]) => {
    const missingMandatory = mandatorySchemes.filter(
      scheme => !currentItems.some(item => item.identifierScheme === scheme),
    );

    missingMandatory.forEach(scheme => {
      const mandatorySchema = oneOfOptions.find(
        option => option.properties.identifierScheme.const === scheme,
      );
      if (mandatorySchema) {
        const newItem: any = {};
        Object.entries(mandatorySchema.properties).forEach(
          ([key, prop]: [string, any]) => {
            if (prop.const) {
              newItem[key] = prop.const;
            } else if (
              (hasValueSetBinding(scheme) || hasEclBinding(scheme)) &&
              key === 'identifierValue'
            ) {
              newItem[key] = null;
            } else if (prop.default) {
              newItem[key] = prop.default;
            } else {
              newItem[key] = '';
            }
          },
        );
        currentItems.push(newItem);
      }
    });

    if (missingMandatory.length > 0) {
      onChange(currentItems);
    }
  };

  const isRemoveDisabled = (index: number) => {
    const item = items[index];
    const scheme = item.identifierScheme;
    const isMandatory = mandatorySchemes.includes(scheme);
    const isMultiValued = multiValuedSchemes.includes(scheme);
    const count = items.filter(i => i.identifierScheme === scheme).length;

    return isMandatory && !isMultiValued && count === 1;
  };

  const isAddDisabled = () => {
    const selectedSchema = oneOfOptions.find(
      option => option.title === dropdownType,
    );
    const scheme = selectedSchema?.properties.identifierScheme.const;
    const isMultiValued = multiValuedSchemes.includes(scheme);

    return (
      !isMultiValued && items.some(item => item.identifierScheme === scheme)
    );
  };

  const getUnfilledMandatorySchemes = () => {
    return mandatorySchemes.filter(
      scheme =>
        !items.some(
          item =>
            item.identifierScheme === scheme &&
            item.identifierValue &&
            item.identifierValue !== '',
        ),
    );
  };

  const unfilledMandatorySchemes = getUnfilledMandatorySchemes();

  return (
    <Box>
      {!skipTitle && title && (
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
      )}

      {items.map((item: any, index: number) => {
        const schemaOption = oneOfOptions.find(
          option =>
            option.properties.identifierScheme.const === item.identifierScheme,
        );
        if (!schemaOption) return null;

        const scheme = item.identifierScheme;
        const useValueSetAutocomplete = hasValueSetBinding(scheme);
        const useEclAutocomplete = hasEclBinding(scheme);
        const isMandatoryUnfilled =
          mandatorySchemes.includes(scheme) &&
          (!item.identifierValue || item.identifierValue === '');

        return (
          <Box
            key={`${id}-${index}`}
            sx={{
              mb: 2,
              border: '1px solid #ddd',
              p: 2,
              borderRadius: '4px',
              position: 'relative',
              ...(submitAttempted &&
                isMandatoryUnfilled && {
                  borderColor: 'error.main',
                }),
            }}
          >
            <Typography variant="subtitle1">{schemaOption.title}</Typography>
            {Object.entries(schemaOption.properties).map(
              ([propName, propSchema]: [string, any]) => (
                <div key={propName}>
                  {renderField(
                    propName,
                    propSchema,
                    item[propName],
                    newValue =>
                      updateItem(index, { ...item, [propName]: newValue }),
                    disabled,
                    readonly,
                    useValueSetAutocomplete,
                    useEclAutocomplete,
                    scheme,
                    binding,
                    isMandatoryUnfilled, // Pass validation state
                    submitAttempted, // Pass submission state
                    task?.branchPath,
                  )}
                </div>
              ),
            )}
            {!readonly && !disabled && (
              <IconButton
                onClick={() => removeItem(index)}
                disabled={isRemoveDisabled(index)}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                <RemoveCircleOutlineIcon
                  color={isRemoveDisabled(index) ? 'disabled' : 'error'}
                />
              </IconButton>
            )}
          </Box>
        );
      })}

      {/* Global validation warning */}
      {submitAttempted && unfilledMandatorySchemes.length > 0 && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          Please fill in the required fields for:{' '}
          {unfilledMandatorySchemes.join(', ')}
        </Typography>
      )}

      {!readonly && !disabled && (
        <Box sx={{ mt: 1 }}>
          <FormControl sx={{ minWidth: 120, mr: 1 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={dropdownType}
              onChange={e => setDropdownType(e.target.value)}
            >
              {oneOfOptions.map(option => (
                <MenuItem key={option.title} value={option.title}>
                  {option.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={addItem} disabled={isAddDisabled()}>
            <AddCircleOutlineIcon
              color={isAddDisabled() ? 'disabled' : 'primary'}
            />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default OneOfArrayWidget;
