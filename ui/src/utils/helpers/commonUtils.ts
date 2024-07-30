export function detectDelimiter(inputString: string): string | null {
  // Define the potential delimiters
  const delimiters = [',', '\t', '\r\n', '\n'];

  // Count the occurrences of each delimiter
  const counts = delimiters.map(delimiter => {
    return inputString.split(delimiter).length - 1;
  });

  const activeDelimiterCount = counts.filter(c => c > 0);
  if (activeDelimiterCount.length > 1) {
    //Multiple delimiters found
    return null;
  }
  const maxCount = Math.max(...counts);
  // Find the delimiters with the maximum count
  const maxDelimiters = delimiters.filter(
    (delimiter, index) => counts[index] === maxCount,
  );

  // Return the delimiter if only one has the maximum count
  return maxDelimiters[0];
}
export function containsCharacters(array: string[]) {
  return array.some(item => typeof item === 'string' && /[a-zA-Z]/.test(item));
}
