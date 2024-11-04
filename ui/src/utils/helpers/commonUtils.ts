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

export function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function parseSearchTermsSctId(
  searchTerm: string | null | undefined,
): string[] {
  if (!searchTerm) return [];
  // Split the searchTerm by commas and trim each part
  const terms = searchTerm.split(',').map(term => term.trim());

  // If the last term is an empty string or not a valid number, remove it
  if (
    terms[terms.length - 1] === '' ||
    isNaN(Number(terms[terms.length - 1]))
  ) {
    terms.pop();
  }

  // If any part is not a valid number, return an empty array
  if (terms.some(term => isNaN(Number(term)))) {
    return [];
  }

  // Convert each valid part to a number and return as an array
  return terms;
}
