import React, { useEffect, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Concept, ConceptMini } from '../../../../types/concept.ts';
import { useSearchConceptsByEcl } from '../../../../hooks/api/useInitializeConcepts.tsx';
import { FieldProps } from '@rjsf/utils';
import useApplicationConfigStore from '../../../../stores/ApplicationConfigStore.ts';

const EclAutocomplete: React.FC<FieldProps<any, any>> = props => {
  const {
    id,
    ecl,
    branch,
    value,
    isDisabled,
    errorMessage,
    sx,
    onChange,
    schema,
    showDefaultOptions,
    uiSchema,
    required,
    turnOffPublishParam,
    info,
  } = props;

  const apLanguageHeader =
    useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader;

  const [selectedValue, setSelectedValue] = useState<Concept | null>(
    value || createEmptyConcept(apLanguageHeader),
  );
  const [searchText, setSearchText] = useState(value?.pt?.term || '');
  const [options, setOptions] = useState<Concept[]>(
    value ? [value as Concept] : [],
  );

  const disabled = isDisabled || props.disabled || false;

  useEffect(() => {
    if (disabled) {
      setSelectedValue(createEmptyConcept(apLanguageHeader));
      setSearchText('');
      setOptions([]);
      if (value) {
        onChange(null);
      }
    }
  }, [disabled, onChange, value]);

  const { isLoading, allData } = useSearchConceptsByEcl(
    searchText,
    ecl && ecl.length > 0 && !disabled ? ecl : undefined,
    branch,
    (showDefaultOptions as boolean) && !disabled,
    undefined,
    turnOffPublishParam,
  );

  const title = props?.title || schema?.title || uiSchema?.['ui:title'] || '';
  const label = required ? `${title} *` : title;

  useEffect(() => {
    if (disabled) return;
    let uniqueOptions: Concept[] = [];
    if (allData) {
      uniqueOptions = Array.from(
        new Map(allData.map(item => [item.conceptId, item])).values(),
      );
    }
    if (
      value?.conceptId &&
      !uniqueOptions.some(opt => opt.conceptId === value.conceptId)
    ) {
      uniqueOptions.push(value as Concept);
    }
    setOptions(uniqueOptions);
  }, [allData, disabled, value]);

  useEffect(() => {
    if (disabled) return;
    if (value) {
      setSelectedValue(value as Concept);
      setSearchText(value.pt?.term || '');
    } else {
      setSelectedValue(null);
      setSearchText('');
    }
  }, [value?.conceptId, disabled]);

  const handleProductChange = (selectedProduct: Concept | null) => {
    if (disabled) return;
    if (selectedProduct) {
      const conceptMini: ConceptMini = {
        conceptId: selectedProduct.conceptId || undefined,
        pt: selectedProduct.pt,
        fsn: selectedProduct.fsn,
      };
      onChange(conceptMini);
      setSelectedValue(selectedProduct);
      setSearchText(selectedProduct.pt?.term || '');
    } else {
      onChange(null);
      setSelectedValue(createEmptyConcept(apLanguageHeader));
      setSearchText('');
    }
  };

  const handleBlur = () => {
    if (disabled) return;
    if (searchText && !value?.conceptId) {
      const matchingOption = options.find(
        option => option.pt?.term?.toLowerCase() === searchText.toLowerCase(),
      );
      if (matchingOption) {
        handleProductChange(matchingOption);
      } else {
        handleProductChange(createEmptyConcept(apLanguageHeader, searchText));
      }
    }
  };

  const needsAttention = value && value.pt?.term && !value.conceptId;
  const needsAttentionMessage =
    needsAttention && !errorMessage
      ? 'Please search for and select a valid option'
      : undefined;

  return (
    <span data-component-name="EclAutocomplete" style={{ width: 'inherit' }}>
      <Autocomplete
        loading={isLoading}
        disabled={disabled}
        options={disabled ? [] : options}
        getOptionLabel={(option: Concept) => option?.pt?.term || ''}
        value={selectedValue}
        inputValue={searchText}
        onInputChange={(event, newInputValue) => {
          if (!disabled) {
            setSearchText(newInputValue);
          }
        }}
        onChange={(event, selectedValue) =>
          handleProductChange(selectedValue as Concept)
        }
        isOptionEqualToValue={(option, selectedValue) =>
          option?.conceptId === selectedValue?.conceptId
        }
        renderOption={(props, option) => (
          <li {...props} key={option.conceptId}>
            {option.pt.term}
          </li>
        )}
        renderInput={params => (
          <TextField
            {...params}
            data-test-id={id}
            label={label}
            onBlur={handleBlur}
            helperText={
              errorMessage
                ? errorMessage
                : needsAttentionMessage
                  ? needsAttentionMessage
                  : info
            }
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            disabled={disabled}
            sx={{
              '& .MuiFormHelperText-root': {
                m: 0,
                minHeight: '1em',
                color:
                  errorMessage || needsAttention
                    ? 'error.main'
                    : 'text.secondary',
              },
            }}
          />
        )}
        sx={sx || { width: '100%' }}
      />
    </span>
  );
};

function createEmptyConcept(
  preferredLanguageCode: string,
  term?: string,
): Concept {
  return {
    conceptId: undefined,
    active: undefined,
    definitionStatus: null,
    moduleId: null,
    effectiveTime: null,
    pt: {
      lang: preferredLanguageCode,
      term: term || '',
      semanticTag: undefined,
    },
    fsn: {
      lang: preferredLanguageCode,
      term: term || '',
      semanticTag: undefined,
    },
    descendantCount: null,
    isLeafInferred: null,
    relationships: [],
    classAxioms: [],
    gciAxioms: [],
    id: null,
    idAndFsnTerm: null,
  };
}

export default EclAutocomplete;
