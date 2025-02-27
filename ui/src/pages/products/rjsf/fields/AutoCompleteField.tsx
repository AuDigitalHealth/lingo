import React, { useState, useEffect } from 'react';
import { FieldProps } from '@rjsf/core';
import {
  Autocomplete,
  CircularProgress,
  TextField,
  Box,
  FormHelperText,
} from '@mui/material';

import { ConceptMini } from '../../../../types/concept.ts';
import { SetExtendedEclButton } from '../../components/SetExtendedEclButton.tsx';
import EclAutocomplete from "../components/EclAutocomplete.tsx"; // Import your button component

const AutoCompleteField = ({
                                 schema,
                                 uiSchema,
                                 formData,
                                 onChange,
                                 rawErrors,
                               }: FieldProps) => {
  const { branch, ecl, showDefaultOptions, extendedEcl } = uiSchema['ui:options'] || {};
  const [localExtendedEcl, setLocalExtendedEcl] = useState<boolean>(false);
  const currentEcl = localExtendedEcl ? extendedEcl : ecl;

  const title = schema.title || uiSchema['ui:title'];
  const isDisabled = uiSchema['ui:options']?.disabled || false;
  const errorMessage = rawErrors && rawErrors[0] ? rawErrors[0].message || '' : '';

  const handleChange = (conceptMini: ConceptMini | null) => {
    onChange(conceptMini);
  };

  return (
      <Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box flex={50}>
            <EclAutocomplete
                value={formData}
                onChange={handleChange}
                ecl={currentEcl}
                branch={branch}
                showDefaultOptions={showDefaultOptions}
                isDisabled={isDisabled}
                title={title}
                errorMessage={errorMessage}
            />
          </Box>
          {extendedEcl && (
              <Box flex={1}>
                <SetExtendedEclButton
                    setExtendedEcl={setLocalExtendedEcl}
                    extendedEcl={localExtendedEcl}
                    disabled={isDisabled}
                />
              </Box>
          )}
        </Box>
        {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
      </Box>
  );
};

export default AutoCompleteField;
