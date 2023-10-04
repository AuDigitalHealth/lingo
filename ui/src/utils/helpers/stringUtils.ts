export function truncateString(inputString: string, maxLength: number) {
  if (inputString.length <= maxLength) {
    return inputString;
  } else {
    return inputString.slice(0, maxLength) + '...';
  }
}
