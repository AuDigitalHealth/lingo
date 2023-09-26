export function validateQueryParams(queryString: string): boolean {
  // Remove the leading "?" if present
  if (queryString.startsWith('?')) {
    queryString = queryString.slice(1);
  }

  // Split the query string into key-value pairs
  const queryParams = queryString.split('&');

  // Iterate through each key-value pair and check for empty values
  for (const param of queryParams) {
    const [key, value] = param.split('=');

    // Check if the key or value is missing or if the value is empty
    if (!key || !value || value.trim() === '') {
      return false; // Invalid query parameter found
    }
  }

  return true; // All query parameters are valid
}

export function createQueryStringFromKeyValue(keyValue: string): string {
  const keyValuePairs = keyValue.split(' ').map(pair => pair.split(':'));
  const filteredPairs = keyValuePairs.filter(pair => pair[0] && pair[1]);

  if (filteredPairs.length === 0) {
    return ''; // Return an empty string if no valid key-value pairs exist
  }

  const queryString = filteredPairs
    .map(
      pair => `${encodeURIComponent(pair[0])}=${encodeURIComponent(pair[1])}`,
    )
    .join('&');
  return `?${queryString}`;
}
