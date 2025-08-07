import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {
  AdditionalFields,
  NonDefiningProperty,
} from '../../../../types/product.ts';
import AdditionalFieldDisplay from './AdditionalFieldDisplay.tsx';

interface AdditionalFieldsEditorProps {
  schema: any;
  formData: NonDefiningProperty[];
  onChange: (data: NonDefiningProperty[]) => void;
  schemeName: string;
  schemeEntries: string[];
  maxItems?: number;
  readOnly?: boolean;
  info?: string;
  errorTooltip?: string;
  setErrorTooltip: (tooltip: string) => void;
  missingRequiredFieldError?: boolean;
  isMultivalued?: boolean;
  isEclAutoComplete?: boolean;
  isValueSetAutoComplete?: boolean;
}

export const AdditionalFieldsEditor: React.FC<AdditionalFieldsEditorProps> = ({
  schema,
  formData,
  onChange,
  maxItems,
  info,
  errorTooltip,
  setErrorTooltip,
  missingRequiredFieldError,
  isMultivalued = false,
}) => {
  const isValueType = schema?.properties?.value ? true : false;
  const [currentEntry, setCurrentEntry] = useState<{
    identifier: string;
    additionalFields: AdditionalFields;
  }>({
    identifier: '',
    additionalFields: {},
  });

  const additionalFieldsSchema =
    schema?.properties?.additionalFields?.properties;

  const handleAddCombination = () => {
    setErrorTooltip('');
    const trimmed = currentEntry.identifier.trim();
    if (!trimmed) return;

    const pattern = schema.properties.value?.pattern;
    if (pattern && !new RegExp(`^${pattern}$`).test(trimmed)) {
      const patternErrorMessage =
        schema.properties.value?.errorMessage?.pattern;
      setErrorTooltip(
        patternErrorMessage ||
          `"${trimmed}" does not match the pattern "${pattern}".`,
      );
      return;
    }

    if (
      (formData ?? []).some(
        item =>
          item.value === trimmed &&
          item.identifierScheme === schema.properties.identifierScheme.const,
      )
    ) {
      setErrorTooltip(`Identifier "${trimmed}" is already added.`);
      return;
    }

    const newEntry: NonDefiningProperty = {
      identifierScheme: schema.properties.identifierScheme.const,
      relationshipType: schema.properties.relationshipType?.const ?? null,
      type: schema.properties.type?.const ?? null,
      value: trimmed,
      additionalFields: currentEntry.additionalFields,
    };

    if (isMultivalued) {
      const currentCount = formData?.length ?? 0;
      if (maxItems && currentCount >= maxItems) {
        setErrorTooltip(`Only ${maxItems} items allowed for ${schema.title}`);
        return;
      }

      onChange([...(formData ?? []), newEntry]);
      setCurrentEntry({ identifier: '', additionalFields: {} });
    } else {
      onChange([newEntry]);
      setCurrentEntry({ identifier: '', additionalFields: {} });
    }
  };

  const handleDeleteEntry = (index: number) => {
    const updated = formData?.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
        {isValueType ? (
          <TextField
            label={schema.title || 'Identifier'}
            fullWidth
            size="small"
            margin="dense"
            value={currentEntry.identifier}
            onChange={e =>
              setCurrentEntry(prev => ({
                ...prev,
                identifier: e.target.value,
              }))
            }
            error={errorTooltip || missingRequiredFieldError}
            helperText={
              errorTooltip ||
              (missingRequiredFieldError ? 'Field must be populated' : info)
            }
            sx={{
              '& .MuiFormHelperText-root': {
                m: 0,
                minHeight: '1em',
                color:
                  errorTooltip || missingRequiredFieldError
                    ? 'error.main'
                    : 'text.secondary',
              },
            }}
          />
        ) : (
          <span>Not supported type</span>
        )}{' '}
        {/* //TODO enhance it if needed in future */}
        {Object.entries(additionalFieldsSchema || {}).map(
          ([key, subschema]) => {
            const enumOptions = subschema?.properties?.value?.enum;
            return (
              <FormControl
                key={key}
                fullWidth
                size="small"
                margin="dense"
                sx={{ mt: 1 }}
              >
                <InputLabel id={`${key}-label`}>
                  {subschema?.title || key}
                </InputLabel>
                {enumOptions ? (
                  <Select
                    labelId={`${key}-label`}
                    value={
                      currentEntry.additionalFields?.[key]?.value ||
                      subschema?.properties?.value?.default
                    }
                    onChange={e =>
                      setCurrentEntry(prev => ({
                        ...prev,
                        additionalFields: {
                          ...prev.additionalFields,
                          [key]: { value: e.target.value },
                        },
                      }))
                    }
                  >
                    {enumOptions?.map((opt: string) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <span>Not supported additional field type</span>
                )}{' '}
                {/* //TODO enhance it if needed in future */}
              </FormControl>
            );
          },
        )}
        <Box mt={2}>
          <Tooltip
            title={
              !isMultivalued && formData?.length > 0
                ? 'Only one value allowed for this field'
                : 'Add Entry'
            }
          >
            <span>
              <IconButton
                onClick={handleAddCombination}
                disabled={!isMultivalued && formData?.length > 0}
              >
                <AddCircleOutlineIcon
                  sx={{
                    color:
                      !isMultivalued && formData?.length > 0
                        ? 'action.disabled'
                        : 'primary.main',
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {(isMultivalued ? formData : formData.slice(0, 1)).map((entry, index) => (
        <AdditionalFieldDisplay
          key={index}
          entry={entry}
          onDelete={() => handleDeleteEntry(index)}
        />
      ))}
    </Box>
  );
};
