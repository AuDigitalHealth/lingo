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

  const { data: dataConceptsCurr, isFetching: isFetchingConceptsCurr } = useConceptsByEcl(branch, `^ ${refsetMember.referencedComponentId}`, 1);
  const { data: dataConceptsNew, error: errorConceptsNew, isFetching: isFetchingConceptsNew } = useConceptsByEcl(branch, confirmEcl, 1);

  const updateRefsetMutation = useUpdateRefsetMember(branch); 
  const { isError, isSuccess, data, isLoading } = updateRefsetMutation;

  const handleClose = () => setOpen(false);

  const updateQuery = () => {
    if (refsetMember) {
      let newMember = {...refsetMember, additionalFields: {
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
  }, [data, isSuccess, isError]);


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

interface InvalidEclErrorProps {
  error: AxiosError<SnowstormError>
}

function InvalidEclError({error}: InvalidEclErrorProps) {

  let message = error.response?.data.message;

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
