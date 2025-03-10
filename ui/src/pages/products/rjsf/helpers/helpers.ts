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
