export function validateQueryParams(queryString: string): boolean {
  if (queryString.includes('undefined')) return false;
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
      const translatedKey = mappedQueryValues[key];
      console.log('translatedKey');
      console.log(translatedKey);
      const encodedKey = encodeURIComponent(
        translatedKey !== undefined ? translatedKey : key,
      );
      const encodedValue = encodeURIComponent(value);
      return `${encodedKey}=${encodedValue}`;
    })
    .join('&');

  if (!queryString) {
    return ''; // Return an empty string if the input string is empty
  }

  return `?${queryString}`;
}

interface Map {
  [key: string]: string | undefined;
}

// expand on this map, for when they want to add other things or other specific terms that they want to query by.
const mappedQueryValues: Map = {
  iteration: 'iteration.name',
  priority: 'priorityBucket.name',
  status: 'state.label',
  label: 'labels.name',
  labels: 'labels.name',
};
