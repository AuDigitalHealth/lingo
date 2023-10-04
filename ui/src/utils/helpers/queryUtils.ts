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
  const keyValuePairs = keyValue.split(', ');
  const queryString = keyValuePairs
    .map(pair => {
      const [key, value] = pair.split(':');
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(value);
      return `${encodedKey}=${encodedValue}`;
    })
    .join('&');

  if (!queryString) {
    return ''; // Return an empty string if the input string is empty
  }

  return `?${queryString}`;
}
