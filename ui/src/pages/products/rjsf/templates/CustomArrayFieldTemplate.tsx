import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import BoxArrayFieldTemplate from './BoxArrayFieldTemplate';
import AccordionArrayFieldTemplate from './AccordionArrayFieldTemplate';
import FieldChipsArrayTemplate from './FieldChipsArrayTemplate';

const CustomArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = (props) => {
  const templateType = props.uiSchema['ui:options']?.arrayTemplate;
  console.log('CustomArrayFieldTemplate Props:', props);

  switch (templateType) {
    case 'accordion':
      return <AccordionArrayFieldTemplate {...props} />;
    case 'fieldChips':
      return <FieldChipsArrayTemplate {...props} />;
    default:
      return <BoxArrayFieldTemplate {...props} />;
  }
};

export default CustomArrayFieldTemplate;