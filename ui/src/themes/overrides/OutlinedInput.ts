///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

// material-ui
import { Theme } from '@mui/material/styles';

// project import
import getColors from '../../utils/getColor';
import getShadow from '../../utils/getShadow';

// types
import { ThemeMode } from '../../types/config';
import { ColorProps } from '../../types/extended';

interface Props {
  variant: ColorProps;
  theme: Theme;
}

// ==============================|| OVERRIDES - INPUT BORDER & SHADOWS ||============================== //

function getColor({ variant, theme }: Props) {
  const colors = getColors(theme, variant);
  const { light } = colors;

  const shadows = getShadow(theme, `${variant}`);

  return {
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: light,
    },
    '&.Mui-focused': {
      boxShadow: shadows,
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${light}`,
      },
    },
  };
}

// ==============================|| OVERRIDES - OUTLINED INPUT ||============================== //

export default function OutlinedInput(theme: Theme) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          padding: '10.5px 14px 10.5px 12px',
        },
        notchedOutline: {
          borderColor:
            theme.palette.mode === ThemeMode.DARK
              ? theme.palette.grey[200]
              : theme.palette.grey[300],
        },
        root: {
          ...getColor({ variant: 'primary', theme }),
          '&.Mui-error': {
            ...getColor({ variant: 'error', theme }),
          },
        },
        inputSizeSmall: {
          padding: '7.5px 8px 7.5px 12px',
        },
        inputMultiline: {
          padding: 0,
        },
        colorSecondary: getColor({ variant: 'secondary', theme }),
        colorError: getColor({ variant: 'error', theme }),
        colorWarning: getColor({ variant: 'warning', theme }),
        colorInfo: getColor({ variant: 'info', theme }),
        colorSuccess: getColor({ variant: 'success', theme }),
      },
    },
  };
}
