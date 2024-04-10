import { AxiosError } from "axios";
import { SnowstormError } from "../../../types/ErrorHandler";
import { Alert } from "@mui/material";

interface InvalidEclErrorProps {
  error: AxiosError<SnowstormError>
}

export default function InvalidEclError({error}: InvalidEclErrorProps) {

  const message = error.response?.data.message;

  return (
    <Alert severity="error" sx={{
      color: "rgb(95, 33, 32)",
      alignItems: 'center',
      width: '100%',
      '& .MuiSvgIcon-root': {
        fontSize: '22px'
      },
      '& .MuiAlert-message': {
        mt: 0
      }
    }}
    >
      {`Check ECL expression: ${message}`}
    </Alert>
  );
}