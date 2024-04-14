import { Box, Icon, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface RefsetDetailElementProps {
  label: string;
  value?: string | boolean;
}

function RefsetDetailElement({ label, value }: RefsetDetailElementProps) {
  return (
    <Box>
      <Typography variant="h6" fontWeight="bold">
        {label}
      </Typography>
      {value === undefined ? (
        <Typography variant="body1" sx={{ visibility: 'hidden' }}>
          undefined
        </Typography>
      ) : typeof value === 'boolean' ? (
        <Icon
          fontSize="inherit"
          sx={{ '& .MuiSvgIcon-root': { fontSize: 'inherit' } }}
        >
          {value ? <CheckIcon /> : <CloseIcon />}
        </Icon>
      ) : (
        <Typography variant="body1">{value}</Typography>
      )}
    </Box>
  );
}

export default RefsetDetailElement;
