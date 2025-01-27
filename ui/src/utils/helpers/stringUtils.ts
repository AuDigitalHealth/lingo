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

export function truncateString(
  inputString: string | undefined,
  maxLength: number,
) {
  if (inputString === undefined) return '';
  if (inputString.length <= maxLength) {
    return inputString;
  } else {
    return inputString.slice(0, maxLength) + '...';
  }
}
// removes html elements from a string, useful for comments or descriptions in rich text format
export function removeHtmlTags(inputString: string) {
  // Create a temporary element (div)
  const tempElement = document.createElement('div');

  // Set the input string as the innerHTML of the temporary element
  tempElement.innerHTML = inputString;

  // Retrieve the text content (without HTML tags)
  const textContent = tempElement.textContent || tempElement.innerText;

  return textContent;
}

export function convertStringToRegex(
  regexString: string | undefined,
): RegExp | null {
  // Handle empty regex string
  if (regexString === '' || regexString === undefined) {
    return null;
  }

  const match = regexString.match(/^\/(.+)\/([gimyus]*)$/);

  if (match) {
    const pattern = match[1];
    const flags = match[2];
    try {
      return new RegExp(pattern, flags);
    } catch (error) {
      console.error('Invalid regular expression:', error);
      return null;
    }
  } else {
    const escapedPattern = regexString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return new RegExp(escapedPattern);
    } catch (error) {
      console.error('Invalid regular expression:', error);
      return null;
    }
  }
}
