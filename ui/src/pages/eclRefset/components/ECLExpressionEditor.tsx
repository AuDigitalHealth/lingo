import {
  Box,
  Button,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonProps,
  Tooltip,
  TooltipProps,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DifferenceIcon from '@mui/icons-material/Difference';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { forwardRef, useEffect, useRef, useState } from 'react';
import EclConceptsList from './ECLConceptsList.tsx';
import ECLBuilderThemeProvider from '../themes/ECLBuilderTheme.tsx';
import ExpressionBuilder from '@csiro/ecl-builder';
import InvalidEclError from './InvalidEclError.tsx';
import { Concept } from '../../../types/concept.ts';
import Confirm from './Confirm.tsx';
import useUserStore from '../../../stores/UserStore.ts';
import useUserTaskByIds from '../../../hooks/eclRefset/useUserTaskByIds.tsx';
import { enqueueSnackbar } from 'notistack';

interface ECLExpressionEditorProps {
  branch: string;
  action: 'update' | 'create';
  concept: Concept;
  previousEcl?: string;
  newEcl: string;
  setNewEcl: (newEcl: string) => void;
  onConfirm: (confirmEcl: string) => void;
  onSuccess: () => void;
  actionDisabled: boolean;
  isActionLoading: boolean;
  isActionSuccess: boolean;
}

function ECLExpressionEditor({
  branch,
  action,
  concept,
  previousEcl,
  newEcl,
  setNewEcl,
  onConfirm,
  onSuccess,
  actionDisabled,
  isActionLoading,
  isActionSuccess,
}: ECLExpressionEditorProps) {
  const task = useUserTaskByIds();
  const { login } = useUserStore();

  const [previewMode, setPreviewMode] = useState<'changes' | 'all'>('changes');
  const [previewEcl, setPreviewEcl] = useState('');
  const [invalidEcl, setInvalidEcl] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const handleClose = () => setConfirmModalOpen(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const refsetId = concept.conceptId;

  useEffect(() => {
    setPreviewEcl('');
    setPreviewMode('changes');
  }, [refsetId]);

  const previewResults = () => {
    if (newEcl !== previewEcl) {
      setInvalidEcl(false);
    }
    setPreviewEcl(newEcl);
  };

  const getAdditionsEcl = () => {
    return refsetId && previewEcl
      ? `(${previewEcl}) MINUS (^ ${refsetId})`
      : '';
  };
  const getDeletionsEcl = () => {
    return refsetId && previewEcl
      ? `(^ ${refsetId}) MINUS (${previewEcl})`
      : '';
  };
  const getAllConceptsEcl = () => {
    return previewEcl;
  };

  useEffect(() => {
    if (isActionSuccess) {
      const refsetLabel =
        concept?.pt?.term || concept?.fsn?.term || concept?.conceptId || '';
      enqueueSnackbar(
        `ECL for reference set '${refsetLabel}' was ${action}d successfully`,
        {
          variant: 'success',
          autoHideDuration: 5000,
        },
      );
      handleClose();
      onSuccess();
    }
  }, [isActionSuccess, concept, onSuccess, action]);

  return (
    <>
      <Stack spacing={1}>
        <ECLBuilderThemeProvider>
          <ExpressionBuilder
            expression={newEcl}
            onChange={setNewEcl}
            options={{ terminologyServerUrl: '/snowstorm/fhir' }}
          />
        </ECLBuilderThemeProvider>
      </Stack>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={2} mt={0}>
          {concept && login === task?.assignee.username ? (
            <Confirm
              open={confirmModalOpen}
              setOpen={setConfirmModalOpen}
              action={action}
              concept={concept}
              newEcl={newEcl}
              branch={branch}
              isActionLoading={isActionLoading}
              buttonDisabled={actionDisabled}
              onConfirm={onConfirm}
            />
          ) : null}
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            disabled={!newEcl.trim()}
            onClick={() => {
              previewResults();
              setTimeout(() => {
                previewRef.current?.scrollIntoView({
                  behavior: 'smooth',
                });
              });
            }}
          >
            Preview
          </Button>
        </Stack>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            disabled={previousEcl ? newEcl === previousEcl : !newEcl}
            onClick={() => setNewEcl(previousEcl ?? '')}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {previewEcl ? (
        <>
          <Divider />
          <Box
            ref={previewRef}
            sx={{
              scrollMarginTop: '60px',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h5">{`Previewing ${previewMode === 'changes' ? 'changes' : 'all concepts'}`}</Typography>
            <ToggleButtonGroup
              value={previewMode}
              exclusive
              color="primary"
              onChange={(event, value: 'changes' | 'all' | null) => {
                if (value) setPreviewMode(value);
              }}
            >
              <TooltipToggleButton
                value="changes"
                TooltipProps={{
                  title:
                    'Preview changes between the current refset membership and the new ECL',
                }}
              >
                <DifferenceIcon />
              </TooltipToggleButton>
              <TooltipToggleButton
                value="all"
                TooltipProps={{
                  title: 'Preview all concepts described by the new ECL',
                }}
              >
                <TextSnippetIcon />
              </TooltipToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Stack direction="row" justifyContent="space-between">
            {invalidEcl ? (
              <InvalidEclError />
            ) : previewMode === 'changes' ? (
              <>
                <Box width="49%">
                  <EclConceptsList
                    type="addition"
                    branch={branch}
                    ecl={getAdditionsEcl()}
                    setInvalidEcl={setInvalidEcl}
                  />
                </Box>
                <Box width="49%">
                  <EclConceptsList
                    type="deletion"
                    branch={branch}
                    ecl={getDeletionsEcl()}
                    setInvalidEcl={setInvalidEcl}
                  />
                </Box>
              </>
            ) : (
              <Box width="100%">
                <EclConceptsList
                  type="all"
                  branch={branch}
                  ecl={getAllConceptsEcl()}
                  setInvalidEcl={setInvalidEcl}
                />
              </Box>
            )}
          </Stack>
        </>
      ) : null}
    </>
  );
}

interface TooltipToggleButtonProps extends ToggleButtonProps {
  TooltipProps: Omit<TooltipProps, 'children'>;
}

const TooltipToggleButton = forwardRef<
  HTMLButtonElement,
  TooltipToggleButtonProps
>(({ TooltipProps, ...props }, ref) => {
  return (
    <Tooltip {...TooltipProps}>
      <ToggleButton ref={ref} {...props} />
    </Tooltip>
  );
});

export default ECLExpressionEditor;
