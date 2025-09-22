import React from 'react';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import dayjs, { Dayjs } from 'dayjs';

interface DesktopDatePickerFieldProps {
  label: string;
  value: string | null; // in YYYY-MM-DD format
  onChange: (value: string | null) => void;
  format?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const DesktopDatePickerField: React.FC<DesktopDatePickerFieldProps> = ({
  label,
  value,
  onChange,
  format = 'YYYY-MM-DD',
  disabled = false,
  error = false,
  helperText = ' ',
}) => {
  const handleChange = (newVal: Dayjs | null) => {
    if (!newVal || !newVal.isValid()) {
      onChange(null);
    } else {
      onChange(newVal.format(format));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesktopDatePicker
        label={label}
        format={format}
        value={value ? dayjs(value) : null}
        onChange={handleChange}
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth: true,
            error,
            helperText,
            sx: {
              '& .MuiFormHelperText-root': {
                m: 0,
                minHeight: '1em',
                color: error ? 'error.main' : 'text.secondary',
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default DesktopDatePickerField;
