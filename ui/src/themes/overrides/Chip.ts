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

// types
import { ExtendedStyleProps } from '../../types/extended';

// ==============================|| CHIP - COLORS ||============================== //

function getColor({ color, theme }: ExtendedStyleProps) {
  const colors = getColors(theme, color);
  const { dark } = colors;

  return {
    '&.Mui-focusVisible': {
      outline: `2px solid ${dark}`,
      outlineOffset: 2,
    },
  };
}

function getColorStyle({ color, theme }: ExtendedStyleProps) {
  const colors = getColors(theme, color);
  const { light, lighter, main } = colors;

  return {
    color: main,
    backgroundColor: lighter,
    borderColor: light,
    '& .MuiChip-deleteIcon': {
      color: main,
      '&:hover': {
        color: light,
      },
    },
  };
}

// ==============================|| OVERRIDES - CHIP ||============================== //

export default function Chip(theme: Theme) {
  const defaultLightChip = getColorStyle({ color: 'secondary', theme });
  return {
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&:active': {
            boxShadow: 'none',
          },
          '&.MuiChip-colorPrimary': getColor({ color: 'primary', theme }),
          '&.MuiChip-colorSecondary': getColor({ color: 'secondary', theme }),
          '&.MuiChip-colorError': getColor({ color: 'error', theme }),
          '&.MuiChip-colorInfo': getColor({ color: 'info', theme }),
          '&.MuiChip-colorSuccess': getColor({ color: 'success', theme }),
          '&.MuiChip-colorWarning': getColor({ color: 'warning', theme }),
        },
        sizeLarge: {
          fontSize: '1rem',
          height: 40,
        },
        light: {
          ...defaultLightChip,
          '&.MuiChip-lightPrimary': getColorStyle({ color: 'primary', theme }),
          '&.MuiChip-lightSecondary': getColorStyle({
            color: 'secondary',
            theme,
          }),
          '&.MuiChip-lightError': getColorStyle({ color: 'error', theme }),
          '&.MuiChip-lightInfo': getColorStyle({ color: 'info', theme }),
          '&.MuiChip-lightSuccess': getColorStyle({ color: 'success', theme }),
          '&.MuiChip-lightWarning': getColorStyle({ color: 'warning', theme }),
        },
        combined: {
          border: '1px solid',
          ...defaultLightChip,
          '&.MuiChip-combinedPrimary': getColorStyle({
            color: 'primary',
            theme,
          }),
          '&.MuiChip-combinedSecondary': getColorStyle({
            color: 'secondary',
            theme,
          }),
          '&.MuiChip-combinedError': getColorStyle({ color: 'error', theme }),
          '&.MuiChip-combinedInfo': getColorStyle({ color: 'info', theme }),
          '&.MuiChip-combinedSuccess': getColorStyle({
            color: 'success',
            theme,
          }),
          '&.MuiChip-combinedWarning': getColorStyle({
            color: 'warning',
            theme,
          }),
        },
      },
    },
  };
}
