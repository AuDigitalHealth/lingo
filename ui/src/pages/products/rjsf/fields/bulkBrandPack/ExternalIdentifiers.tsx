import React, { useState } from 'react';
import { Autocomplete, Box, Chip, Grid, Stack, TextField } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import ValueSetAutocomplete, {
  MultiValueValueSetAutocomplete
} from '../../components/ValueSetAutocomplete';
import EclAutocomplete from '../../components/EclAutocomplete';

const SCHEME_COLORS = ['primary', 'secondary', 'success', 'error', 'warning'];

const getColorByScheme = (scheme: string) => {
  const index =
    scheme?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) %
    SCHEME_COLORS.length;
  return SCHEME_COLORS[index];
};

interface ExternalIdentifier {
  identifierScheme: string;
  relationshipType: string;
  identifierValue: string;
}

interface BindingConfig {
  [key: string]: { valueSet?: string; ecl?: string };
}

const ExternalIdentifiers: React.FC<
  FieldProps<ExternalIdentifier[]>
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

  const schemas = schema?.items?.anyOf as ExternalIdentifier[];

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
  FieldProps<ExternalIdentifier[]>
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

    const newItems: ExternalIdentifier[] = [];

    for (const val of values) {
      const trimmed = val.trim();
      if (!trimmed) continue; // Skip empty strings

      // Check if this identifier already exists
      if (
        formData?.some(
          item =>
            item.identifierValue === trimmed &&
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

      const testObj: ExternalIdentifier = {
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
        item.identifierValue === value && item.identifierScheme === scheme
      );
      return returnVal;
    });
    onChange(returnFormData);
  };

  const renderChip = (item: ExternalIdentifier) => (
    <Chip
      variant="filled"
      key={`${item.identifierScheme}-${item.identifierValue}`}
      label={`${item.identifierValue}`}
      onDelete={
        !readOnly
          ? () => handleDelete(item.identifierValue, item.identifierScheme)
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
        {!useEclAutocomplete && !useValueSetAutocomplete && (
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
            value={schemeEntries?.map(e => e.identifierValue)}
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
                      identifierValue: val,
                      identifierScheme:
                        schema.properties.identifierScheme.const,
                      relationshipType:
                        schema.properties.relationshipType.const,
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
