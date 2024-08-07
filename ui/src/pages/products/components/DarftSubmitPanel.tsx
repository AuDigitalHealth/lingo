import { Control, useFormState } from 'react-hook-form';
import { useEffect, useState } from 'react';
import useAuthoringStore from '../../../stores/AuthoringStore.ts';
import { useBlocker } from 'react-router-dom';
import { Button } from '@mui/material';
import ConfirmationModal from '../../../themes/overrides/ConfirmationModal.tsx';

export interface DraftSubmitPanelProps {
  control: Control<any>;
  saveDraft: () => void;
}
export function DraftSubmitPanel({
  control,
  saveDraft,
}: DraftSubmitPanelProps) {
  const { dirtyFields } = useFormState({ control });
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const isDirty = Object.keys(dirtyFields).length > 0;
  const { forceNavigation } = useAuthoringStore();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !forceNavigation &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    setConfirmationModalOpen(blocker.state === 'blocked');
  }, [blocker]);

  const handleProceed = () => {
    if (blocker.proceed === undefined) return;
    blocker.proceed();
  };

  const handleReset = () => {
    if (blocker.reset === undefined) return;
    blocker.reset();
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && !forceNavigation) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, forceNavigation]);

  return (
    <>
      <Button
        variant="contained"
        color="info"
        disabled={!isDirty}
        onClick={saveDraft}
        data-testid={'partial-save-btn'}
      >
        Save Progress
      </Button>
      {blocker.proceed !== undefined && blocker.reset !== undefined && (
        <ConfirmationModal
          content={''}
          disabled={false}
          open={confirmationModalOpen}
          title={'Unsaved changes will be lost'}
          action="Proceed"
          handleAction={handleProceed}
          handleClose={handleReset}
          reverseAction="Back"
        />
      )}
    </>
  );
}
