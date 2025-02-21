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

  if (propSchema.type === 'array') {
    return (
      <TextField
        label={propSchema.title || propName}
        value={(value || []).join(', ')}
        onChange={e =>
          onChange(e.target.value.split(',').map((v: string) => v.trim()))
        }
        fullWidth
        disabled={disabled || readonly}
        error={
          value &&
          value.some(
            (v: string) =>
              !new RegExp(propSchema.items.pattern || '.*').test(v),
          )
        }
        helperText={
          value &&
          value.some(
            (v: string) =>
              !new RegExp(propSchema.items.pattern || '.*').test(v),
          )
            ? propSchema.items.errorMessage?.pattern || 'Invalid format'
            : ''
        }
        sx={{ mb: 1 }}
      />
    );
  }

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

  // Ensure schema.items.oneOf exists
  if (!schema.items || !('oneOf' in schema.items)) {
    console.error(
      'OneOfArrayWidget requires an array with oneOf schema:',
      schema,
    );
    return <div>Error: Expected an array with oneOf schema</div>;
  }

  const oneOfOptions = schema.items.oneOf as any[];
  const items = Array.isArray(value) ? value : [];

  const [selectedType, setSelectedType] = useState<string>(
    oneOfOptions[0]?.title || '',
  );

  // Determine title: prefer uiSchema.ui:options.title, fallback to schema.title
  const title = uiSchema['ui:options']?.title || schema.title || 'Items';

  const addItem = () => {
    const selectedSchema = oneOfOptions.find(
      option => option.title === selectedType,
    );
    if (!selectedSchema) return;

    const newItem: any = {};
    Object.entries(selectedSchema.properties).forEach(
      ([key, prop]: [string, any]) => {
        if (prop.const) {
          newItem[key] = prop.const;
        } else if (prop.default) {
          newItem[key] = prop.default;
        } else if (prop.type === 'array') {
          newItem[key] = [];
        } else {
          newItem[key] = '';
        }
      },
    );

    onChange([...items, newItem]);
  };

  const updateItem = (index: number, updated: any) => {
    const newItems = [...items];
    newItems[index] = updated;
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  return (
    <Box>
      {/* Add title here */}

      {title && (
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
              <IconButton onClick={() => removeItem(index)}>
                <RemoveCircleOutlineIcon color="error" />
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
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              {oneOfOptions.map(option => (
                <MenuItem key={option.title} value={option.title}>
                  {option.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={addItem}>
            Add {selectedType}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default OneOfArrayWidget;
