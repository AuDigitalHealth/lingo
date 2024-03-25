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
