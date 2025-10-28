import React, { useEffect, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import {
  Concept,
  ConceptMini,
  ConceptSearchResult,
} from '../../../../types/concept.ts';
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
  const [inputValue, setInputValue] = useState<Concept>(
    value || createEmptyConcept(apLanguageHeader),
  );
  const [options, setOptions] = useState<ConceptSearchResult[]>(
    value ? [value as ConceptSearchResult] : [],
  );

  const disabled = isDisabled || props.disabled || false;

  // Clear state when disabled
  useEffect(() => {
    if (disabled) {
      setInputValue(createEmptyConcept(apLanguageHeader));
      setOptions([]);
      if (value) {
        onChange(null);
      }
    }
  }, [disabled, onChange, value]);

  const { isLoading, allData } = useSearchConceptsByEcl(
    inputValue?.pt?.term,
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
      let processedData = allData;

      // Only classify types when turnOffPublishParam is true
      if (turnOffPublishParam) {
        processedData = [
          ...allData
            .filter(item => !item.effectiveTime) // no effectiveTime = unpublished
            .map(item => ({ ...item, type: 'Unpublished Concepts' })),
          ...allData
            .filter(item => item.effectiveTime) // has effectiveTime = published
            .map(item => ({ ...item, type: 'Published Concepts' })),
        ];
      }
      uniqueOptions = Array.from(
        new Map(processedData.map(item => [item.conceptId, item])).values(),
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
    if (disabled || !value) return;
    const newTerm = value?.pt?.term || '';
    setInputValue(prev => (prev?.pt?.term !== newTerm ? value : prev));
  }, [value?.conceptId, disabled]);

  const handleProductChange = (selectedProduct: Concept | null) => {
    if (disabled) return;
    if (selectedProduct) {
      const conceptMini: ConceptMini = {
        conceptId: selectedProduct.conceptId || undefined,
        pt: selectedProduct.pt,
        fsn: selectedProduct.fsn,
        definitionStatus: selectedProduct.definitionStatus,
      };
      onChange(conceptMini);
      setInputValue(selectedProduct);
    } else {
      onChange(null);
      setInputValue(createEmptyConcept(apLanguageHeader));
    }
  };

  const handleBlur = () => {
    if (disabled) return;
    if (inputValue?.pt?.term && !value?.conceptId) {
      const matchingOption = options.find(
        option =>
          option.pt?.term?.toLowerCase() === inputValue?.pt?.term.toLowerCase(),
      );

      if (matchingOption) {
        handleProductChange(matchingOption);
      } else {
        handleProductChange(inputValue);
      }
    }
  };

  const normalizedValue =
    options.find(option => option.conceptId === value?.conceptId) || value;
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
        getOptionLabel={(option: ConceptSearchResult) => option?.pt?.term || ''}
        value={normalizedValue}
        onInputChange={(event, newInputValue) => {
          !disabled &&
            setInputValue(createEmptyConcept(apLanguageHeader, newInputValue));
        }}
        groupBy={option => option.type}
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
            // error={hasError}
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
