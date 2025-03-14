import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import BoxArrayFieldTemplate from './BoxArrayFieldTemplate';
import AccordionArrayFieldTemplate from './AccordionArrayFieldTemplate';
import BrandArrayTemplate from './bulkBrandPack/BrandArrayTemplate.tsx';

const CustomArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = (props) => {
  const templateType = props.uiSchema['ui:options']?.arrayTemplate;
  console.log('CustomArrayFieldTemplate Props:', props);
  switch (templateType) {
    case 'accordion':
      return <AccordionArrayFieldTemplate {...props} />;
    default:
      return <BoxArrayFieldTemplate {...props} />;
  }
};

export default CustomArrayFieldTemplate;