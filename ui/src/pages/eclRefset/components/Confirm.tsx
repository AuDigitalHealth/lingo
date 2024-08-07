import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import CheckIcon from '@mui/icons-material/Check';
import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../../components/modal/BaseModalFooter.tsx';
import { Concept, ConceptResponse } from '../../../types/concept.ts';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import { SnowstormError } from '../../../types/ErrorHandler.ts';
import InvalidEclError from './InvalidEclError.tsx';

const WARNING_PERCENT_THRESHOLD = 0.05;
const WARNING_COUNT_THRESHOLD = 2000;

interface ConfirmModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  action: 'update' | 'create';
  concept: Concept;
  newEcl: string;
  branch: string;
  buttonDisabled: boolean;
  isActionLoading: boolean;
  onConfirm: (confirmEcl: string) => void;
}
export default function ConfirmModal({
  open,
  setOpen,
  action,
  concept,
  newEcl,
  branch,
  buttonDisabled,
  isActionLoading,
  onConfirm,
}: ConfirmModalProps) {
  const [confirmEcl, setConfirmEcl] = useState('');
  const [invalidEcl, setInvalidEcl] = useState(false);

  useEffect(() => {
    setConfirmEcl('');
  }, [concept]);

  const getAdditionsEcl = () => {
    return confirmEcl ? `(${confirmEcl}) MINUS (^ ${concept.conceptId})` : '';
  };
  const getDeletionsEcl = () => {
    return confirmEcl ? `(^ ${concept.conceptId}) MINUS (${confirmEcl})` : '';
  };

  const { data: dataConceptsCurr, isFetching: isFetchingConceptsCurr } =
    useConceptsByEcl(branch, `^ ${concept.conceptId}`, {
      limit: 1,
      activeFilter: true,
    });
  const {
    data: dataConceptsAdds,
    error: errorConceptsAdds,
    isFetching: isFetchingConceptsAdds,
  } = useConceptsByEcl(branch, getAdditionsEcl(), {
    limit: 1,
    activeFilter: true,
  });
  const {
    data: dataConceptsDels,
    error: errorConceptsDels,
    isFetching: isFetchingConceptsDels,
  } = useConceptsByEcl(branch, getDeletionsEcl(), {
    limit: 1,
    activeFilter: true,
  });

  const handleClose = () => setOpen(false);

  const refsetLabel =
    concept.pt?.term || concept.fsn?.term || concept.conceptId;

  useEffect(() => {
    if (errorConceptsAdds) {
      const err = (errorConceptsAdds ??
        errorConceptsDels) as AxiosError<SnowstormError>;
      if (err.response?.status === 400) {
        setInvalidEcl(true);
        return;
      }
    }
    setInvalidEcl(false);
  }, [errorConceptsAdds, errorConceptsDels]);

  const buttonLoading =
    !!confirmEcl &&
    (isFetchingConceptsAdds ||
      isFetchingConceptsDels ||
      isFetchingConceptsCurr);

  return (
    <>
      <LoadingButton
        loading={buttonLoading}
        loadingPosition="start"
        variant="contained"
        startIcon={<CheckIcon />}
        onClick={() => {
          setConfirmEcl(newEcl.trim());
          setOpen(true);
        }}
        disabled={buttonDisabled}
        sx={{
          color: '#fff',
          '&.Mui-disabled': {
            color: '#919191',
          },
        }}
      >
        {buttonLoading ? 'Checking ECL...' : capitalize(action)}
      </LoadingButton>

      <BaseModal
        open={
          open &&
          !!confirmEcl &&
          !isFetchingConceptsCurr &&
          !isFetchingConceptsAdds &&
          !isFetchingConceptsDels
        }
        handleClose={handleClose}
        sx={{ minWidth: '400px' }}
      >
        <BaseModalHeader title={`Confirm ${capitalize(action)}`} />
        <BaseModalBody>
          <Stack spacing={1}>
            <Typography variant="body1" sx={{ p: '6px 0px' }}>
              {`Would you like to ${action} the ECL expression for '${refsetLabel}'?`}
            </Typography>
            {invalidEcl && (errorConceptsAdds || errorConceptsDels) ? (
              <InvalidEclError />
            ) : null}
            {dataConceptsCurr && dataConceptsAdds && dataConceptsDels ? (
              <RefsetMembershipWarning
                currData={dataConceptsCurr}
                additionsData={dataConceptsAdds}
                deletionsData={dataConceptsDels}
              />
            ) : null}
          </Stack>
        </BaseModalBody>
        <BaseModalFooter
          startChildren={<></>}
          endChildren={
            <Stack direction="row" spacing={1}>
              <LoadingButton
                variant="contained"
                loading={isActionLoading}
                disabled={invalidEcl}
                onClick={() => onConfirm(confirmEcl)}
                sx={{ color: '#fff' }}
              >
                Confirm
              </LoadingButton>
              <Button variant="outlined" onClick={() => handleClose()}>
                Cancel
              </Button>
            </Stack>
          }
        />
      </BaseModal>
    </>
  );
}

interface RefsetMembershipWarningProps {
  currData: ConceptResponse;
  additionsData: ConceptResponse;
  deletionsData: ConceptResponse;
}

function RefsetMembershipWarning({
  currData,
  additionsData,
  deletionsData,
}: RefsetMembershipWarningProps) {
  const warnings = Array<string>();

  const countWarning = (num: number, type: string) =>
    `Number of ${type} (${num}) exceeds ${WARNING_COUNT_THRESHOLD}.`;
  const percentWarning = (num: number, type: string) =>
    `Number of ${type} (${num}) exceeds ${WARNING_PERCENT_THRESHOLD * 100}% of the current reference set membership size (${currData.total}).`;

  if (additionsData.total >= WARNING_COUNT_THRESHOLD)
    warnings.push(countWarning(additionsData.total, 'additions'));
  if (deletionsData.total >= WARNING_COUNT_THRESHOLD)
    warnings.push(countWarning(deletionsData.total, 'deletions'));

  if (!warnings.length && currData.total) {
    if (additionsData.total / currData.total > WARNING_PERCENT_THRESHOLD)
      warnings.push(percentWarning(additionsData.total, 'additions'));
    if (deletionsData.total / currData.total > WARNING_PERCENT_THRESHOLD)
      warnings.push(percentWarning(deletionsData.total, 'deletions'));
  }

  return warnings.length ? (
    <Alert
      severity="warning"
      sx={{
        width: '100%',
        color: 'rgb(102, 60, 0)',
        alignItems: 'center',
        whiteSpace: 'pre-wrap',
        '& .MuiSvgIcon-root': {
          color: '#ed6c02',
          fontSize: '22px',
        },
      }}
    >
      {warnings.map((warning, ind) => {
        if (!ind) return warning;
        return (
          <>
            <br />
            {warning}
          </>
        );
      })}
    </Alert>
  ) : null;
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
