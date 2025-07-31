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
    rawErrors,
    errorMessage,
    sx,
    onChange,
    schema,
    showDefaultOptions,
    uiSchema,
    required,
    turnOffPublishParam,
  } = props;

  const apLanguageHeader = useApplicationConfigStore.getState().applicationConfig
                ?.apLanguageHeader;
  // const [inputValue, setInputValue] = useState<Concept>(value || createEmptyConcept(apLanguageHeader));
  const [options, setOptions] = useState<Concept[]>(
    value ? [value as Concept] : [],
  );

  const disabled = isDisabled || props.disabled || false;

  // Clear state when disabled
  useEffect(() => {
    debugger;
    if (disabled) {
      onChange(null);
      // setInputValue(createEmptyConcept(apLanguageHeader));
      setOptions([]);
      if (value) {
        onChange(null);
      }
    }
  }, [disabled, onChange, value]);

  const { isLoading, allData } = useSearchConceptsByEcl(
    value?.pt?.term,
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
    if (disabled || !value) return;
    const newTerm = value?.pt?.term || '';
    // setInputValue(prev => (prev !== newTerm ? newTerm : prev));
  }, [value?.conceptId, disabled]);

  const handleProductChange = (selectedProduct: Concept | null) => {
    debugger;
    if (disabled) return;
    if (selectedProduct) {
      const conceptMini: ConceptMini = {
        conceptId: selectedProduct.conceptId || '',
        pt: selectedProduct.pt,
        fsn: selectedProduct.fsn,
      };
      onChange(conceptMini);
      // setInputValue(selectedProduct);
    } else {
      onChange(null);
      // setInputValue(createEmptyConcept(apLanguageHeader));
    }
  };

  const needsAttention = value && value.pt?.term && !value.conceptId;

  return (
    <span data-component-name="EclAutocomplete" style={{ width: 'inherit' }}>
      <Autocomplete
        loading={isLoading}
        disabled={disabled}
        options={disabled ? [] : options}
        getOptionLabel={(option: Concept) => option?.pt?.term || ''}
        value={
          value
          // options.find(option => option.conceptId === value?.conceptId) || value
        }
        // inputValue={value?.pt?.term}
        onInputChange={(event, newInputValue) =>{
          // debugger;
          !disabled && handleProductChange(createEmptyConcept(apLanguageHeader, newInputValue))}
        }
        onChange={(event, selectedValue) =>
          handleProductChange(selectedValue as Concept)
        }
        isOptionEqualToValue={(option, selectedValue) =>
          {
            if(!selectedValue?.conceptId) return false;
            return option?.conceptId === selectedValue?.conceptId}
          
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
            helperText={
              needsAttention
                ? 'Please search for and select a valid option'
                : errorMessage || ''
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

function createEmptyConcept(preferredLanguageCode: string, term?: string ): Concept {
  return {
    conceptId: undefined,
    active: undefined,
    definitionStatus: null,
    moduleId: null,
    effectiveTime: null,
    pt: { lang: preferredLanguageCode, term: term || '', semanticTag: undefined },
    fsn: { lang: preferredLanguageCode, term: term || '', semanticTag: undefined },
    descendantCount: null,
    isLeafInferred: null,
    relationships: [],
    classAxioms: [],
    gciAxioms: [],
    id: null,
    idAndFsnTerm: null
  };
}

export default EclAutocomplete;
