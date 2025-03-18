import _ from 'lodash';

export const getItemTitle = (
  uiSchema: any,
  formData: any,
  index: number,
  defaultTitle = 'Untitled',
) => {
  const titleSource = uiSchema.items?.['ui:options']?.titleSource;
  if(uiSchema.items?.['ui:options']?.defaultTitle){
    defaultTitle = uiSchema.items?.['ui:options']?.defaultTitle;
  }
  return titleSource && formData && formData[index]
    ? _.get(formData[index], titleSource) || `${defaultTitle} ${index + 1}`
    : `${defaultTitle} ${index + 1}`;
};
export function getParentPath(fullPath) {
  const match = fullPath.match(/^(.*)\.[^.]+$/);
  return match ? match[1] : fullPath;
}
// Function to get uiSchema path
export function getUiSchemaPath(fieldPath) {
  const parts = fieldPath.split('.');
  const uiSchemaParts = parts.map(part => {
    // Check if the part ends with [index], e.g., "containedProducts[0]"
    const match = part.match(/^(.*)\[\d+\]$/);
    if (match) {
      // Return the base name followed by "items"
      return `${match[1]}.items`;
    }
    return part; // No array index, return unchanged
  });
  return uiSchemaParts.join('.');
}
