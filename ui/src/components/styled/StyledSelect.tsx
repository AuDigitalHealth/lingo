import { outlinedInputClasses } from '@mui/material';
import { styled } from '@mui/material';
import Select from '@mui/material/Select';

export default styled(Select)(`
  & .${outlinedInputClasses.notchedOutline} {
    border-width: 0;
  }
`);
