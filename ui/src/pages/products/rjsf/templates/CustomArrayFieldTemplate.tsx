import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import BoxArrayFieldTemplate from './BoxArrayFieldTemplate';
import AccordionArrayFieldTemplate from './AccordionArrayFieldTemplate';

const CustomArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = props => {
  const templateType = props.uiSchema['ui:options']?.arrayTemplate;
  return templateType === 'accordion' ? (
    <AccordionArrayFieldTemplate {...props} />
  ) : (
    <BoxArrayFieldTemplate {...props} />
  );
};

export default CustomArrayFieldTemplate;
