import React, { useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

// Utility to infer field type and render appropriate input
const renderField = (
  propName: string,
  propSchema: any,
  value: any,
  onChange: (newValue: any) => void,
  disabled: boolean,
  readonly: boolean,
) => {
  if (propSchema.const) {
    return null; // Hidden if constant (e.g., identifierScheme)
  }

  if (propSchema.enum) {
    return (
      <FormControl fullWidth sx={{ mb: 1 }}>
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
      </FormControl>
    );
  }

  // Handle all fields as single-valued (no array logic needed)
  return (
    <TextField
      label={propSchema.title || propName}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      fullWidth
      disabled={disabled || readonly}
      error={
        propSchema.pattern && !new RegExp(propSchema.pattern).test(value || '')
      }
      helperText={
        propSchema.pattern && !new RegExp(propSchema.pattern).test(value || '')
          ? propSchema.errorMessage?.pattern || 'Invalid format'
          : ''
      }
      sx={{ mb: 1 }}
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
  } = props;

  if (!schema.items || !('oneOf' in schema.items)) {
    console.error(
      'OneOfArrayWidget requires an array with oneOf schema:',
      schema,
    );
    return <div>Error: Expected an array with oneOf schema</div>;
  }

  const oneOfOptions = schema.items.oneOf as any[];
  const items = Array.isArray(value) ? value : [];

  // Extract mandatory and multi-valued schemes from uiSchema
  const mandatorySchemes = uiSchema['ui:options']?.mandatorySchemes || [];
  const multiValuedSchemes = uiSchema['ui:options']?.multiValuedSchemes || [];

  // Set initial selectedType based on the last item (if any), otherwise first option
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

  const addItem = () => {
    const selectedSchema = oneOfOptions.find(
      option => option.title === dropdownType,
    );
    const scheme = selectedSchema?.properties.identifierScheme.const;
    const isMultiValued = multiValuedSchemes.includes(scheme);

    if (!selectedSchema) return;

    // Prevent adding more than one item if not multi-valued
    if (
      !isMultiValued &&
      items.some(item => item.identifierScheme === scheme)
    ) {
      return;
    }

    const newItem: any = {};
    Object.entries(selectedSchema.properties).forEach(
      ([key, prop]: [string, any]) => {
        if (prop.const) {
          newItem[key] = prop.const;
        } else if (prop.default) {
          newItem[key] = prop.default;
        } else {
          newItem[key] = '';
        }
      },
    );

    const newItems = [...items, newItem];
    onChange(newItems);
    enforceMandatoryConstraints(newItems);
  };

  const updateItem = (index: number, updated: any) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange(newItems);
    enforceMandatoryConstraints(newItems);
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

    onChange(currentItems);
  };

  // Check if remove is disabled for mandatory, single-valued schemes
  const isRemoveDisabled = (index: number) => {
    const item = items[index];
    const scheme = item.identifierScheme;
    const isMandatory = mandatorySchemes.includes(scheme);
    const isMultiValued = multiValuedSchemes.includes(scheme);
    const count = items.filter(i => i.identifierScheme === scheme).length;

    return isMandatory && !isMultiValued && count === 1;
  };

  return (
    <Box>
      {!uiSchema['ui:options']?.skipTitle && (
        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
          {title}
        </Typography>
      )}

      {items.map((item: any, index: number) => {
        const schemaOption = oneOfOptions.find(
          option =>
            option.properties.identifierScheme.const === item.identifierScheme,
        );
        if (!schemaOption) return null;

        return (
          <Box
            key={`${id}-${index}`}
            sx={{
              mb: 2,
              border: '1px solid #ddd',
              p: 2,
              borderRadius: '4px',
              position: 'relative',
            }}
          >
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
                  )}
                </div>
              ),
            )}
            {!readonly && !disabled && (
              <IconButton
                onClick={() => removeItem(index)}
                disabled={isRemoveDisabled(index)}
              >
                <RemoveCircleOutlineIcon
                  color={isRemoveDisabled(index) ? 'disabled' : 'error'}
                />
              </IconButton>
            )}
          </Box>
        );
      })}
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
          <Button variant="contained" onClick={addItem}>
            Add {dropdownType}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default OneOfArrayWidget;
