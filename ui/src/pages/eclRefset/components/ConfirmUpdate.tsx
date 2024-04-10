import { Alert, Button, Stack, Typography } from '@mui/material';
import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';
import { RefsetMember } from '../../../types/RefsetMember.ts';
import BaseModalFooter from '../../../components/modal/BaseModalFooter.tsx';
import { Concept, ConceptResponse } from '../../../types/concept.ts';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import { useEffect, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import CheckIcon from '@mui/icons-material/Check';
import { enqueueSnackbar } from 'notistack';
import { useUpdateRefsetMember } from '../../../hooks/eclRefset/useUpdateRefsetMember.tsx';
import { AxiosError } from 'axios';
import { SnowstormError } from '../../../types/ErrorHandler.ts';
import InvalidEclError from './InvalidEclError.tsx';

const WARNING_THRESHOLD = 0.05;

interface ConfirmUpdateProps {
  refsetMember: RefsetMember;
  newEcl: string;
  branch: string;
  buttonDisabled: boolean;
  onSuccess: () => void;
}
export default function ConfirmUpdate({
  refsetMember,
  newEcl,
  branch,
  buttonDisabled,
  onSuccess,
}: ConfirmUpdateProps) {

  const concept = refsetMember?.referencedComponent as Concept;

  const [confirmEcl, setConfirmEcl] = useState("")
  const [open, setOpen] = useState(false);
  const [invalidEcl, setInvalidEcl] = useState(false);

  const { data: dataConceptsCurr, isFetching: isFetchingConceptsCurr } = useConceptsByEcl(branch, `^ ${refsetMember.referencedComponentId}`, {limit: 1, activeFilter: true});
  const { data: dataConceptsNew, error: errorConceptsNew, isFetching: isFetchingConceptsNew } = useConceptsByEcl(branch, confirmEcl, {limit: 1, activeFilter: true});

  const updateRefsetMutation = useUpdateRefsetMember(branch); 
  const { isSuccess, isLoading } = updateRefsetMutation;

  const handleClose = () => setOpen(false);

  const updateQuery = () => {
    if (refsetMember) {
      const newMember = {...refsetMember, additionalFields: {
        ...refsetMember.additionalFields,
        query: newEcl
      }}

      updateRefsetMutation.mutate(newMember);
    }
  }

  const refsetLabel = concept?.pt?.term || concept.fsn?.term || refsetMember?.referencedComponentId

  useEffect(() => {
    if (isSuccess) {
      enqueueSnackbar(
        `ECL for reference set '${refsetLabel}' was updated successfully`,
        {
          variant: 'success',
          autoHideDuration: 5000
        },
      );
      handleClose();
      onSuccess();
    }
  }, [isSuccess, refsetLabel, onSuccess]);


  useEffect(() => {
    if (errorConceptsNew) {
      const err = errorConceptsNew as AxiosError<SnowstormError>;
      if (err.response?.status === 400) {
        setInvalidEcl(true); return;
      }
    }
    setInvalidEcl(false);
  }, [errorConceptsNew])

  const updateButtonLoading = isFetchingConceptsNew || (!!confirmEcl && isFetchingConceptsCurr);

  return (
    <>
      <LoadingButton 
        loading={updateButtonLoading}
        loadingPosition='start'
        variant="contained" 
        startIcon={<CheckIcon />} 
        onClick={() => {
          setConfirmEcl(newEcl);
          setOpen(true);
        }}
        disabled={buttonDisabled}
        sx={{mr: "1em", color: '#fff', 
          "&.Mui-disabled": {
            color: "#919191"
          }
        }}
      >
        {updateButtonLoading ? "Checking ECL..." : "Update"}
      </LoadingButton>


      <BaseModal open={open && !!confirmEcl && !isFetchingConceptsCurr && !isFetchingConceptsNew } handleClose={handleClose} sx={{ minWidth: '400px' }} >
        <BaseModalHeader title="Confirm Update"/>
        <BaseModalBody>
          <Stack spacing={1}>
            <Typography variant="body1" sx={{p: "6px 0px"}}>
              {`Would you like to update the ECL expression for '${refsetLabel}'?`}
            </Typography>
            {
              invalidEcl && errorConceptsNew ?
              <InvalidEclError error={errorConceptsNew as AxiosError<SnowstormError>}/>
              : null
            }
            {
              dataConceptsCurr && dataConceptsNew ?
              <RefsetMembershipWarning currData={dataConceptsCurr} newData={dataConceptsNew}/>
              : null
            }
          </Stack>
        </BaseModalBody>
        <BaseModalFooter 
          startChildren={<></>}
          endChildren={
            <Stack direction="row" spacing={1}>
              <LoadingButton 
                variant="contained" 
                loading={isLoading}
                disabled={invalidEcl}
                onClick={() => updateQuery()}
                sx={{color: '#fff'}}
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
  newData: ConceptResponse;
}

function RefsetMembershipWarning({
  currData,
  newData
}: RefsetMembershipWarningProps) {

  const percentChange = (newData.total - currData.total)/currData.total

  return (
    Math.abs(percentChange) > WARNING_THRESHOLD ?
    <Alert severity="warning" sx={{
      width: '100%',
      color: "rgb(102, 60, 0)",
      alignItems: 'center',
      whiteSpace: 'pre-wrap',
      '& .MuiSvgIcon-root': {
        color: '#ed6c02',
        fontSize: '22px'
      }
    }}
    >
      {`Preview of ECL expression change shows reference set membership ${percentChange > 0 ? "increasing" : "decreasing"} by over ${WARNING_THRESHOLD * 100}%.`}
      <br />
      <b>Current: </b>{currData.total} concepts
      <br />
      <b>New: </b>{newData.total} concepts
    </Alert>
    : null
  );
}

