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

export enum ColorCode {
  default = 'rgba(0, 0, 0, 0.08)',
  Aqua = '#00A2AE',
  Red = '#F04134',
  Orange = '#ff9800',
  Green = '#00A854',
  Yellow = '#FFBF00',
  Purple = '#ce93d8',
}

export function getColorCodeKey(value: ColorCode) {
  value = handleDbColors(value);
  return Object.keys(ColorCode)[Object.values(ColorCode).indexOf(value)];
}
export function handleDbColors(color: ColorCode) {
  if (color === undefined) {
    color = ColorCode.default;
  } else if (color.toLowerCase() === 'success') {
    color = ColorCode.Green;
  } else if (color.toLowerCase() === 'info') {
    color = ColorCode.default;
  } else if (color.toLowerCase() === 'warning') {
    color = ColorCode.Yellow;
  }
  return color;
}
