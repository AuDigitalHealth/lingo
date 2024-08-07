import { Expand } from '@mui/icons-material';
import { IconButton } from '@mui/material';

interface SetExtendedEclButtonProps {
  setExtendedEcl: (bool: boolean) => void;
  extendedEcl: boolean;
  disabled?: boolean;
}
export const SetExtendedEclButton = ({
  setExtendedEcl,
  extendedEcl,
  disabled,
}: SetExtendedEclButtonProps) => {
  const toggleUseExtendedEcl = () => {
    setExtendedEcl(!extendedEcl);
  };
  return (
    <>
      <IconButton
        onClick={() => toggleUseExtendedEcl()}
        disabled={disabled}
        color={extendedEcl ? 'primary' : 'secondary'}
      >
        <Expand />
      </IconButton>
    </>
  );
};
