import { Button, Stack, useTheme, Typography } from '@mui/material';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';

interface SemanticTagOverrideModalProps {
  open: boolean;
  messages?: string[];
  handleClose: () => void;
  ignore: () => void;
}
export function SemanticTagOverrideModal({
  open,
  handleClose,
  ignore,
  messages,
}: SemanticTagOverrideModalProps) {
  const theme = useTheme();

  return (
    <BaseModal open={open} handleClose={handleClose}>
      <div style={{ backgroundColor: theme.palette.warning.light }}>
        <BaseModalHeader title={'Warning!'} />
      </div>
      <BaseModalBody data-testid={'override-modal'}>
        <>
          The follow changes were found from the generated semantic tags:
          {messages?.map(message => {
            return <Typography variant="body1">{message}</Typography>;
          })}
        </>
      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Stack direction="row" spacing={1}>
            <Button
              color="error"
              size="small"
              variant="contained"
              onClick={() => ignore()}
              data-testid={'warning-and-proceed-btn'}
            >
              {'Proceed'}
            </Button>
            <Button
              color="primary"
              size="small"
              variant="contained"
              onClick={() => handleClose()}
              data-testid={'back-button'}
            >
              {'Return to Screen'}
            </Button>
          </Stack>
        }
      />
    </BaseModal>
  );
}
