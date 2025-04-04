import React, { useState, useEffect } from 'react';
import { WidgetProps } from '@rjsf/utils';
import {
  Box,
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

// Define interfaces for type safety
interface SchemaProperty {
  const?: string;
  default?: string;
  enum?: string[];
  title?: string;
  pattern?: string;
  errorMessage?: { pattern?: string };
}

interface SchemaOption {
  title: string;
  properties: { [key: string]: SchemaProperty };
}

interface Item {
  identifierScheme: string;
  identifierValue: string | null;
  [key: string]: string | null;
}

interface BindingConfig {
  [key: string]: { valueSet?: string; ecl?: string };
}

// Define the renderField function with proper types
const renderField = (
  propName: string,
  propSchema: SchemaProperty,
  value: string | null,
  onChange: (newValue: string | null) => void,
  disabled: boolean,
  readonly: boolean,
  valueSetAutocomplete = false,
  eclAutocomplete = false,
  scheme: string,
  bindingConfig: BindingConfig,
  isMandatoryUnfilled = false,
  submitAttempted = false,
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
          url={binding.valueSet || ''}
          showDefaultOptions={false}
          value={value}
          onChange={onChange}
          disabled={disabled || readonly}
          error={!!errorMessage}
        />
      </Box>
    );
  } else if (eclAutocomplete && branch) {
    const binding = bindingConfig[scheme] || {};
    return (
      <Box paddingTop={1}>
        <EclAutocomplete
          value={value}
          ecl={binding.ecl || ''}
          branch={branch}
          onChange={onChange}
          showDefaultOptions={false}
          isDisabled={disabled || readonly}
          errorMessage={errorMessage}
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
          {propSchema.enum.map(option => (
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
    disabled,
    readonly,
    uiSchema,
    rawErrors = [],
  }: any = props;

  const task = useTaskById();
  const oneOfOptions =
    (schema.items as { oneOf?: SchemaOption[] })?.oneOf || [];
  const items: Item[] = Array.isArray(value) ? value as Item[] : [];
  const binding: BindingConfig = uiSchema['ui:options']?.binding || {};
  const mandatorySchemes: string[] =
    uiSchema['ui:options']?.mandatorySchemes || [];
  const multiValuedSchemes: string[] =
    uiSchema['ui:options']?.multiValuedSchemes || [];
  const skipTitle: boolean = uiSchema['ui:options']?.skipTitle || false;

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

  const title: string =
    uiSchema['ui:options']?.title || schema.title || 'Items';
  const submitAttempted = rawErrors.length > 0;

  const hasValueSetBinding = (scheme: string): boolean =>
    !!binding[scheme]?.valueSet;
  const hasEclBinding = (scheme: string): boolean => !!binding[scheme]?.ecl;

  useEffect(() => {
    enforceMandatoryConstraints(items);
  }, [items]);

  const addItem = () => {
    const selectedSchema = oneOfOptions.find(
      option => option.title === dropdownType,
    );
    if (!selectedSchema) return;

    const scheme = selectedSchema.properties.identifierScheme.const;
    if (
      !scheme ||
      (!multiValuedSchemes.includes(scheme) &&
        items.some(item => item.identifierScheme === scheme))
    ) {
      return;
    }

    const newItem: Item = {};
    Object.entries(selectedSchema.properties).forEach(([key, prop]) => {
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
    });

    onChange([...items, newItem]);
  };

  const updateItem = (index: number, updated: Item) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    enforceMandatoryConstraints(newItems);
  };

  const enforceMandatoryConstraints = (currentItems: Item[]) => {
    const missingMandatory = mandatorySchemes.filter(
      scheme => !currentItems.some(item => item.identifierScheme === scheme),
    );

    missingMandatory.forEach(scheme => {
      const mandatorySchema = oneOfOptions.find(
        option => option.properties.identifierScheme.const === scheme,
      );
      if (mandatorySchema) {
        const newItem: Item = {};
        Object.entries(mandatorySchema.properties).forEach(([key, prop]) => {
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
        });
        currentItems.push(newItem);
      }
    });

    if (missingMandatory.length > 0) {
      onChange(currentItems);
    }
  };

  const isRemoveDisabled = (index: number): boolean => {
    const item = items[index];
    const scheme = item.identifierScheme;
    const isMandatory = mandatorySchemes.includes(scheme);
    const isMultiValued = multiValuedSchemes.includes(scheme);
    const count = items.filter(i => i.identifierScheme === scheme).length;

    return isMandatory && !isMultiValued && count === 1;
  };

  const isAddDisabled = (): boolean => {
    const selectedSchema = oneOfOptions.find(
      option => option.title === dropdownType,
    );
    if (!selectedSchema) return true;

    const scheme = selectedSchema.properties.identifierScheme.const;
    return (
      !multiValuedSchemes.includes(scheme) &&
      items.some(item => item.identifierScheme === scheme)
    );
  };

  const getUnfilledMandatorySchemes = (): string[] => {
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

  if (!schema.items || !('oneOf' in schema.items)) {
    console.error(
      'OneOfArrayWidget requires an array with oneOf schema:',
      schema,
    );
    return <div>Error: Expected an array with oneOf schema</div>;
  }

  return (
    <Box>
      {!skipTitle && title && (
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
      )}

      {items.map((item, index) => {
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
                isMandatoryUnfilled && { borderColor: 'error.main' }),
            }}
          >
            <Typography variant="subtitle1">{schemaOption.title}</Typography>
            {Object.entries(schemaOption.properties).map(
              ([propName, propSchema]) => (
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
                    isMandatoryUnfilled,
                    submitAttempted,
                    task?.branchPath || '',
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
