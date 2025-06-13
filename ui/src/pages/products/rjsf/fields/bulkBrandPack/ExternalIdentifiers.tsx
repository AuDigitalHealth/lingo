import React, { useState } from 'react';
import {Autocomplete, Box, Checkbox, Chip, FormControlLabel, Grid, Stack, TextField} from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import ValueSetAutocomplete, {
  MultiValueValueSetAutocomplete
} from '../../components/ValueSetAutocomplete';
import EclAutocomplete from '../../components/EclAutocomplete';
import { NonDefiningProperty, NonDefiningPropertyType } from '../../../../../types/product.ts';


const SCHEME_COLORS = ['primary', 'secondary', 'success', 'error', 'warning'];

const getColorByScheme = (scheme: string) => {
  const index =
    scheme?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) %
    SCHEME_COLORS.length;
  return SCHEME_COLORS[index];
};
//
// interface ExternalIdentifier {
//   identifierScheme: string;
//   relationshipType: string;
//   identifierValue: string;
// }

interface NonDefiningPropertyDefinition {
  identifierScheme: string;
  relationshipType: string;
  valueObject: string;
  value: string;
  type: NonDefiningPropertyType;
}

interface BindingConfig {
  [key: string]: { valueSet?: string; ecl?: string };
}

const ExternalIdentifiers: React.FC<
  FieldProps<NonDefiningProperty[]>
> = props => {
  const { onChange, schema, uiSchema, registry } = props;
  const {
    optionsByScheme = {},
    schemeLimits = {},
    freeSoloByScheme = {},
    onChipClick,
    readOnly,
    branch,
  } = (uiSchema && uiSchema['ui:options']) || {};

  const formData = props.formData;

  const schemas = schema?.items?.anyOf as NonDefiningPropertyDefinition[];

  return (
    <>
      <Grid container spacing={2}>
        {schemas.map((schema, index) => {
          return (
            <Grid item xs={12} md={6} key={index}>
              <ExternalIdentifierRender
                sx={{ margin: 1 }}
                formData={formData}
                onChange={updated => {
                  onChange(updated);
                }}
                schema={schema}
                uiSchema={uiSchema}
                registry={registry}
                branch={branch}
              />
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};

const ExternalIdentifierRender: React.FC<
  FieldProps<NonDefiningProperty[]>
> = props => {
  const { onChange, schema, uiSchema, registry } = props;
  const {
    optionsByScheme = {},
    schemeLimits = {},
    freeSoloByScheme = {},
    onChipClick,
    readOnly,
    branch
  } = (uiSchema && uiSchema['ui:options']) || {};

  const schemeName = schema?.properties?.identifierScheme?.const;

  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [tooltip, setTooltip] = useState<string>('');

  const [maxItems, setMaxItems] = useState<number>(9999);
  const [freeSolo, setFreeSolo] = useState<boolean>(true);

  const formData = props.formData;
  const multiValuedSchemes: string[] =
    uiSchema['ui:options']?.multiValuedSchemes || [];

  const isMultiValued = multiValuedSchemes.includes(schemeName);
  const isCheckBox = schema?.properties?.type?.const === 'REFERENCE_SET';

  const bindingConfig: BindingConfig = uiSchema['ui:options']?.binding || {};

  const hasValueSetBinding = (scheme: string): boolean =>
    !!bindingConfig[scheme]?.valueSet;

  const hasEclBinding = (scheme: string): boolean =>
    !!bindingConfig[scheme]?.ecl;

  const useValueSetAutocomplete = hasValueSetBinding(schemeName);
  const useEclAutocomplete = hasEclBinding(schemeName);

  const binding = bindingConfig[schemeName] || {};

  const schemeEntries =
    formData?.filter(
      f => f.identifierScheme === schema.properties.identifierScheme.const,
    ) || [];

  const handleAdd = (value: string | string[]) => {
    // Convert single string to array for uniform processing
    const values = Array.isArray(value) ? value : [value];

    const newItems: NonDefiningProperty[] = [];

    for (const val of values) {
      const trimmed = val.trim();
      if (!trimmed) continue; // Skip empty strings

      // Check if this identifier already exists
      if (
        formData?.some(
          item =>
            item.value === trimmed &&
            item.identifierScheme === schema.properties.identifierScheme.const,
        )
      ) {
        setTooltip(`Identifier "${trimmed}" is already added.`);
        continue; // Skip this one but continue with others
      }

      // Check if adding this item would exceed maxItems
      const currentCount = (formData?.length ?? 0) + newItems.length;
      if (maxItems && schemeEntries && currentCount >= maxItems) {
        setTooltip(
          `Only ${maxItems} items allowed for ${schema.title}`,
        );
        break; // Stop processing further items
      }

      const testObj: NonDefiningProperty = {
        identifierScheme: schema.properties.identifierScheme.const,
        relationshipType: schema.properties.relationshipType.const,
        identifierValue: trimmed,
      };

      newItems.push(testObj);
    }

    // Only update if we have new items to add
    if (newItems.length > 0) {
      const newFormData = [...(formData ?? []), ...newItems];
      onChange(newFormData);
    }
  };

  const handleDelete = (value: string, scheme: string) => {
    const returnFormData = formData?.filter(item => {
      const returnVal = !(
        item.value === value && item.identifierScheme === scheme
      );
      return returnVal;
    });
    onChange(returnFormData);
  };

  const renderChip = (item: NonDefiningProperty) => (
    <Chip
      variant="filled"
      key={`${item.identifierScheme}-${item.value}`}
      label={`${item.value}`}
      onDelete={
        !readOnly
          ? () => handleDelete(item.value, item.identifierScheme)
          : undefined
      }
    />
  );

  if (readOnly && (!schemeEntries || schemeEntries.length === 0)) {
    return <></>;
  }
  return (
    <Box>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ width: '100%' }}
      >
        {useValueSetAutocomplete && isMultiValued && (
          <MultiValueValueSetAutocomplete
            label={schema.title}
            url={binding.valueSet || ''}
            showDefaultOptions={false}
            value={schemeEntries}
            onChange={handleAdd}
            disabled={readOnly ? true : false}
            //   error={!!errorMessage}
          />
        )}
        {useValueSetAutocomplete && !isMultiValued && (
          <ValueSetAutocomplete
            label={schema.title}
            url={binding.valueSet || ''}
            showDefaultOptions={false}
            value={schemeEntries}
            onChange={handleAdd}
            disabled={readOnly ? true : false}
            //   error={!!errorMessage}
          />
        )}
        {useEclAutocomplete && (
          <EclAutocomplete
            value={schemeEntries}
            ecl={binding.ecl || ''}
            branch={branch}
            onChange={handleAdd}
            showDefaultOptions={false}
            isDisabled={readOnly ? true : false}
            // errorMessage={errorMessage}
            title={schema.title}
          />
        )}
        {isCheckBox && (
            <FormControlLabel
                label={schema.title}
                labelPlacement="start"
                control={
                  <Checkbox
                      checked={formData?.some(item =>
                          item.type === 'REFERENCE_SET' &&
                          item.identifierScheme === schema.properties.identifierScheme.const
                      )}
                      onChange={e => {
                        const scheme = schema.properties.identifierScheme.const;
                        const updated = e.target.checked
                            ? [...(formData || []), { type: 'REFERENCE_SET', identifierScheme: scheme }]
                            : formData?.filter(item =>
                            !(item.type === 'REFERENCE_SET' && item.identifierScheme === scheme)
                        ) || [];
                        onChange(updated);
                      }}
                      disabled={readOnly}
                  />
                }
            />
        )}

        {!useEclAutocomplete && !useValueSetAutocomplete   &&  !isCheckBox &&(
          <Autocomplete
            multiple={true}
            sx={{
              width: '100%',
            }}
            disableClearable={true}
            disabled={readOnly ? true : false}
            freeSolo={freeSolo}
            filterSelectedOptions
            options={availableOptions}
            getOptionLabel={option => option}
            value={schemeEntries?.map(e => e.value)}
            inputValue={inputValue}
            onInputChange={(_, newVal) => {
              setInputValue(newVal);
              setTooltip('');
            }}
            onChange={(_, values, reason, details) => {
              if (reason === 'selectOption' && details?.option) {
                handleAdd(details.option);
              } else if (reason === 'createOption') {
                handleAdd(values[values.length - 1]);
              }
            }}
            renderTags={(values, getTagProps) => (
              <Stack flexDirection={'row'} gap={1} flexWrap={'wrap'}>
                {values.map((val, index) => (
                  <React.Fragment
                    key={`${schema.properties.identifierScheme.const}-${val}-${index}`}
                  >
                    {renderChip({
                      value: val,
                      identifierScheme:
                        schema.properties.identifierScheme.const,
                      relationshipType:
                        schema.properties.relationshipType?.const,
                    })}
                  </React.Fragment>
                ))}
              </Stack>
            )}
            renderInput={params => (
              <TextField
                {...params}
                label={schema.title}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: readOnly
                    ? null
                    : params.InputProps.endAdornment,
                }}
              />
            )}
          />
        )}
      </Stack>
    </Box>
  );
};

export default ExternalIdentifiers;
