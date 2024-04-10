import { Button, Stack, Typography } from '@mui/material';
import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';
import BaseModalFooter from '../../../components/modal/BaseModalFooter.tsx';
import { Concept } from '../../../types/concept.ts';
import { useConceptsByEcl } from '../../../hooks/eclRefset/useConceptsByEcl.tsx';
import { useEffect, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import CheckIcon from '@mui/icons-material/Check';
import { enqueueSnackbar } from 'notistack';
import { useCreateRefsetMember } from '../../../hooks/eclRefset/useUpdateRefsetMember.tsx';
import { AxiosError } from 'axios';
import { SnowstormError } from '../../../types/ErrorHandler.ts';
import { RefsetMember } from '../../../types/RefsetMember.ts';
import InvalidEclError from './InvalidEclError.tsx';

interface ConfirmCreateProps {
  concept: Concept;
  ecl: string;
  branch: string;
  buttonDisabled: boolean;
  onSuccess: () => void;
}
export default function ConfirmCreate({
  concept,
  ecl,
  branch,
  buttonDisabled,
  onSuccess,
}: ConfirmCreateProps) {

  const [confirmEcl, setConfirmEcl] = useState("")
  const [open, setOpen] = useState(false);
  const [invalidEcl, setInvalidEcl] = useState(false);

  const { data: dataConcepts, error: errorConcepts, isFetching: isFetchingConcepts } = useConceptsByEcl(branch, confirmEcl, {limit: 1, activeFilter: true});

  const createRefsetMutation = useCreateRefsetMember(branch); 
  const { isSuccess, isLoading } = createRefsetMutation;

  const handleClose = () => setOpen(false);

  const createRefset = () => {
    if (concept && ecl) {
      const newMember: RefsetMember = { 
        active: true,
        referencedComponentId: concept.conceptId ?? "",
        refsetId: "900000000000513000",
        additionalFields: {
          query: ecl
        }
      }

      createRefsetMutation.mutate(newMember);
    }
  }

  const refsetLabel = concept.pt?.term || concept.fsn?.term || concept.conceptId

  useEffect(() => {
    if (isSuccess) {
      enqueueSnackbar(
        `ECL for reference set '${refsetLabel}' was created successfully`,
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
    if (errorConcepts) {
      const err = errorConcepts as AxiosError<SnowstormError>;
      if (err.response?.status === 400) {
        setInvalidEcl(true); return;
      }
    }
    setInvalidEcl(false);
  }, [errorConcepts])

  return (
    <>
      <LoadingButton 
        loading={isFetchingConcepts}
        loadingPosition='start'
        variant="contained" 
        startIcon={<CheckIcon />} 
        onClick={() => {
          setConfirmEcl(ecl);
          setOpen(true);
        }}
        disabled={buttonDisabled}
        sx={{mr: "1em", color: '#fff', 
          "&.Mui-disabled": {
            color: "#919191"
          }
        }}
      >
        {isFetchingConcepts ? "Checking ECL..." : "Create"}
      </LoadingButton>


      <BaseModal open={open && !!confirmEcl && !isFetchingConcepts } handleClose={handleClose} sx={{ minWidth: '400px' }} >
        <BaseModalHeader title="Confirm Create"/>
        <BaseModalBody>
          <Stack spacing={1}>
            <Typography variant="body1" sx={{p: "6px 0px"}}>
              {`Would you like to create a query-based reference set for '${refsetLabel}'${dataConcepts ? ` (${dataConcepts.total} concepts)` : ''}?`}
            </Typography>
            {
              invalidEcl && errorConcepts ?
              <InvalidEclError error={errorConcepts as AxiosError<SnowstormError>}/>
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
                onClick={() => createRefset()}
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


