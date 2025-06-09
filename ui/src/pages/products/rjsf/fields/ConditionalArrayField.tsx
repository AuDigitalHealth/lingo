import React from 'react';
import { FieldProps } from '@rjsf/utils';
import { Condition, shouldHideField } from '../helpers/conditionUtils.ts';

const ConditionalArrayField: React.FC<FieldProps<any, any>> = props => {
  const { formContext = {}, onChange, registry, uiSchema } = props;
  const opts = (uiSchema && uiSchema['ui:options']) || {};
  const conditions = opts.conditions || ([] as Condition[]);
  const conditionLogic = opts.conditionLogic || 'and';
  const fullFormData = formContext.formData || {};
  // @ts-ignore
  if (
    shouldHideField(
      fullFormData || {},
      conditions as Condition[],
      conditionLogic || 'and',
    )
  )
    return null;
  const ArrayField = registry.fields.ArrayField;
  return (
    <span data-component-name="ConditionalArrayField">
      <ArrayField {...props} />
    </span>
  );
};

export default ConditionalArrayField;
