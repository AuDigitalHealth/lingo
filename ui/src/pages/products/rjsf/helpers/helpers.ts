import _ from 'lodash';

export const getItemTitle = (
  uiSchema: any,
  formData: any,
  index: number,
  defaultTitle = 'Item',
) => {
  const titleSource = uiSchema.items?.['ui:options']?.titleSource;
  return titleSource && formData && formData[index]
    ? _.get(formData[index], titleSource) || `${defaultTitle} ${index + 1}`
    : `${defaultTitle} ${index + 1}`;
};
