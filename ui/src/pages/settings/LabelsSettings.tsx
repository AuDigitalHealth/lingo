import React, { useState } from 'react';
import { LabelType } from '../../types/tickets/ticket.ts';
import {
  Button,
  Card,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';

import useTicketStore from '../../stores/TicketStore.ts';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LabelSettingsModal from './components/labels/LabelSettingsModal.tsx';
import { PlusCircleOutlined } from '@ant-design/icons';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal.tsx';
import TicketsService from '../../api/TicketsService.ts';
import { ticketLabelsKey } from '../../types/queryKeys.ts';
import { useServiceStatus } from '../../hooks/api/useServiceStatus.tsx';
import { useQueryClient } from '@tanstack/react-query';
import { snowstormErrorHandler } from '../../types/ErrorHandler.ts';
import { Stack } from '@mui/system';

export const LabelsSettings: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteModalContent, setDeleteModalContent] = useState('');
  const [labelType, setLabelType] = useState<LabelType>();
  const { labelTypes } = useTicketStore();
  const { serviceStatus } = useServiceStatus();
  const queryClient = useQueryClient();
  const onDialogCloseClick = () => {
    setOpen(false);
  };
  const handleDeleteLabel = () => {
    if (!labelType?.id) {
      return;
    }
    TicketsService.deleteLabelType(labelType.id)
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: [ticketLabelsKey],
        });
      })
      .catch(err => {
        snowstormErrorHandler(
          err,
          `Failed to delete label ${labelType.name}`,
          serviceStatus,
        );
      })
      .finally(() => {
        setDeleteOpen(false);
      });
  };

  return (
    <>
      <Stack>
        <Grid>
          <Stack
            sx={{
              width: '100%',
              padding: '0em 0em 1em 1em',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h4">Labels</Typography>

            <Button
              variant="contained"
              color="success"
              startIcon={<PlusCircleOutlined />}
              sx={{ marginLeft: 'auto' }}
              onClick={() => {
                setLabelType(undefined);
                setOpen(true);
              }}
            >
              Create Label
            </Button>
          </Stack>
        </Grid>
        <Grid
          container
          spacing={2}
          direction="column"
          alignItems="center"
          justifyContent="center"
        >
          <Card>
            <List>
              <>
                {labelTypes.map(function (label: LabelType) {
                  return (
                    <ListItem key={label.id}>
                      <ListItemText
                        primary={label.name}
                        sx={{
                          width: '600px',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      />
                      <ListItemIcon>
                        <Tooltip title={`Edit Label ${label.name}`}>
                          <IconButton
                            onClick={() => {
                              setLabelType(label);
                              setOpen(true);
                            }}
                            edge="start"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemIcon>
                      <ListItemSecondaryAction>
                        <Tooltip title={`Delete Label ${label.name}`}>
                          <IconButton
                            onClick={() => {
                              setLabelType(label);
                              setDeleteOpen(true);
                              setDeleteModalContent(
                                `You are about to permanently remove the label ${label.name}.  This information cannot be recovered.`,
                              );
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}

                {open && (
                  <LabelSettingsModal
                    open={open}
                    handleClose={onDialogCloseClick}
                    labelType={labelType as LabelType}
                  />
                )}
                {deleteOpen && (
                  <ConfirmationModal
                    open={deleteOpen}
                    content={deleteModalContent}
                    handleClose={() => {
                      setDeleteOpen(false);
                    }}
                    title={`Confirm Delete Label ${labelType?.name}`}
                    action={'Remove Label'}
                    handleAction={handleDeleteLabel}
                    reverseAction={'Cancel'}
                  />
                )}
              </>
            </List>
          </Card>
        </Grid>
      </Stack>
    </>
  );
};

export default LabelsSettings;
