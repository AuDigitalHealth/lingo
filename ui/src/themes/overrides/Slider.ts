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

// ==============================|| OVERRIDES - TAB ||============================== //

function getColorStyle({ color, theme }: ExtendedStyleProps) {
  const colors = getColors(theme, color);
  const { main } = colors;

  return {
    border: `2px solid ${main}`,
  };
}

export default function Slider(theme: Theme) {
  return {
    MuiSlider: {
      styleOverrides: {
        track: {
          height: '1px',
        },
        thumb: {
          width: 14,
          height: 14,
          border: `2px solid ${theme.palette.primary.main}`,
          backgroundColor: theme.palette.background.paper,
          '&.MuiSlider-thumbColorPrimary': getColorStyle({
            color: 'primary',
            theme,
          }),
          '&.MuiSlider-thumbColorSecondary': getColorStyle({
            color: 'secondary',
            theme,
          }),
          '&.MuiSlider-thumbColorSuccess': getColorStyle({
            color: 'success',
            theme,
          }),
          '&.MuiSlider-thumbColorWarning': getColorStyle({
            color: 'warning',
            theme,
          }),
          '&.MuiSlider-thumbColorInfo': getColorStyle({ color: 'info', theme }),
          '&.MuiSlider-thumbColorError': getColorStyle({
            color: 'error',
            theme,
          }),
        },
        mark: {
          width: 4,
          height: 4,
          borderRadius: '50%',
          border: `1px solid ${theme.palette.secondary.light}`,
          backgroundColor: theme.palette.background.paper,
          '&.MuiSlider-markActive': {
            opacity: 1,
            borderColor: 'inherit',
            borderWidth: 2,
          },
        },
        rail: {
          color: theme.palette.secondary.light,
        },
        root: {
          '&.Mui-disabled': {
            '.MuiSlider-rail': {
              opacity: 0.25,
            },
            '.MuiSlider-track': {
              color: theme.palette.secondary.lighter,
            },
            '.MuiSlider-thumb': {
              border: `2px solid ${theme.palette.secondary.lighter}`,
            },
          },
        },
        valueLabel: {
          backgroundColor: theme.palette.grey[600],
          color: theme.palette.grey[0],
        },
      },
    },
  };
}
