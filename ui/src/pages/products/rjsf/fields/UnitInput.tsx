import React from 'react';
import { FieldProps } from '@rjsf/utils';
import AutoCompleteField from './AutoCompleteField';

interface UnitInputProps {
  value: any;
  onChange: (val: any) => void;
  options: any;
  showValue?: boolean;
}

const UnitInput: React.FC<UnitInputProps> = ({
  value = {},
  onChange,
  options,
  showValue,
}) => {
  const unit = value.unit || null;
  const val = value.value || '';
  const handleUnit = (u: any) => onChange({ ...value, unit: u });
  const handleValue = (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, value: Number(e.target.value) });
  return (
    <span data-component-name="UnitInput">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {showValue && (
          <input
            type="number"
            value={val}
            onChange={handleValue}
            placeholder="Value"
          />
        )}
        <AutoCompleteField
          {...({} as FieldProps<any, any>)}
          formData={unit}
          onChange={handleUnit}
          uiSchema={{ 'ui:options': options }}
        />
      </div>
    </span>
  );
};

export default UnitInput;
