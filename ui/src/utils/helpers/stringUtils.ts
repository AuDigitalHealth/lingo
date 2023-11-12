export function truncateString(inputString: string, maxLength: number) {
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
