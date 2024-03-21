export enum ColorCode {
  Aqua = '#00A2AE',
  Red = '#F04134',
  Orange = '#ff9800',
  Green = '#00A854',
  Yellow = '#FFBF00',
  Purple = '#ce93d8',
}

export function getColorCodeKey(value: ColorCode) {
  return Object.keys(ColorCode)[Object.values(ColorCode).indexOf(value)];
}
