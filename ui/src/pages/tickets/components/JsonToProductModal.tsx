import React, { useState } from 'react';
import { IconButton, TextField, Box, Alert } from '@mui/material';
import JsonView from '@uiw/react-json-view';
import UnableToEditTooltip from '../../tasks/components/UnableToEditTooltip';
import { Tooltip } from '@mui/material';
import { DataObject } from '@mui/icons-material';
import BaseModal from '../../../components/modal/BaseModal';
import BaseModalHeader from '../../../components/modal/BaseModalHeader';
import BaseModalBody from '../../../components/modal/BaseModalBody';
import BaseModalFooter from '../../../components/modal/BaseModalFooter';
import { Button } from '@mui/material';
import { useCanEditTicket } from '../../../hooks/api/tickets/useCanEditTicket';
import useCanEditTask from '../../../hooks/useCanEditTask';
import {
  ProductAction,
  Ticket,
  TicketProductDto,
} from '../../../types/tickets/ticket';
import { Grid } from '@mui/material';
import { useCreateTicketProducts } from '../../../hooks/api/products/useCreateTicketProduct';

interface JsonToProductModalProps {
  ticket: Ticket;
}

export default function JsonToProductModal({
  ticket,
}: JsonToProductModalProps) {
  const [jsonToProductModalOpen, setJsonToProductModalOpen] = useState(false);
  // eslint-disable-next-line
  const [jsonData, setJsonData] = useState<any>({});
  const [jsonError, setJsonError] = useState('');
  const [rawJsonInput, setRawJsonInput] = useState('');

  const { canEdit: canEditTicket, lockDescription: ticketLockDescription } =
    useCanEditTicket(ticket);
  const { canEdit, lockDescription } = useCanEditTask();

  const createTicketProductMutation = useCreateTicketProducts({});

  const isValidTicketProduct = (
    // eslint-disable-next-line
    obj: any,
  ): obj is Pick<TicketProductDto, 'name' | 'action'> => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.name === 'string' &&
      obj.name.trim() !== '' &&
      typeof obj.action === 'string' &&
      Object.values(ProductAction).includes(obj.action)
    );
  };

  const isValidTicketProductData = (
    // eslint-disable-next-line
    data: any,
  ): data is Pick<TicketProductDto, 'name' | 'action'>[] => {
    // Handle single object
    if (!Array.isArray(data)) {
      return isValidTicketProduct(data);
    }

    return data.length > 0 && data.every(item => isValidTicketProduct(item));
  };

  const handleClose = () => {
    setJsonToProductModalOpen(false);
    setJsonData({});
    setJsonError('');
    setRawJsonInput('');
  };

  // eslint-disable-next-line
  const handleJsonEdit = (params: any) => {
    setJsonData(params.value);
    setJsonError('');
  };

  const handleRawJsonPaste = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    setRawJsonInput(value);

    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setJsonData(parsed);
        setJsonError('');
        setRawJsonInput('');
      } catch (error) {
        setJsonError('Invalid JSON format - please check your syntax');
      }
    }
  };

  const handleSubmit = () => {
    if (Object.keys(jsonData).length === 0) {
      setJsonError('Please enter JSON data');
      return;
    }

    if (!isValidTicketProductData(jsonData)) {
      setJsonError(
        "Invalid data format. Each item must have a 'name' (string) and 'action' (valid ProductAction)",
      );
      return;
    }

    // Convert to array if it's a single object
    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

    const dataArrayCleaned = dataArray.map(item => {
      // Create a copy and remove unwanted fields
      const { id, ticketId, version, ...cleanedData } = item;
      const ticketProductDto = cleanedData as TicketProductDto;

      return ticketProductDto;
    });
    createTicketProductMutation.mutate({
      ticketId: ticket.id,
      ticketProductDto: dataArrayCleaned,
    });
    handleClose();
  };

  const isSubmitDisabled =
    Object.keys(jsonData).length === 0 ||
    !!jsonError ||
    createTicketProductMutation.isPending;

  return (
    <>
      <UnableToEditTooltip
        canEdit={canEditTicket && canEdit}
        lockDescription={
          !canEditTicket ? ticketLockDescription : lockDescription
        }
      >
        <IconButton
          data-testid={'upload-json-button'}
          aria-label="upload-json"
          size="large"
          disabled={!(canEditTicket && canEdit)}
          onClick={() => {
            setJsonToProductModalOpen(true);
          }}
        >
          <Tooltip title={'Create Saves From Json'}>
            <DataObject fontSize="medium" />
          </Tooltip>
        </IconButton>
      </UnableToEditTooltip>

      <BaseModal
        open={jsonToProductModalOpen}
        handleClose={handleClose}
        sx={{ width: '80%', height: '90%' }}
      >
        <Grid container direction="column" sx={{ height: '100%' }}>
          <Grid item>
            <BaseModalHeader title={'Create partial saves from json'} />
          </Grid>
          <Grid
            item
            xs
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              width: '100%',
            }}
          >
            <BaseModalBody
              sx={{
                overflow: 'hidden',
                height: '100%',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  minHeight: 0,
                  padding: '1em',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {jsonError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {jsonError}
                  </Alert>
                )}
                {Object.keys(jsonData).length === 0 && (
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      label="Paste JSON here"
                      placeholder='Paste your JSON here, e.g. {"name": "example", "data": [1,2,3]}'
                      value={rawJsonInput}
                      onChange={handleRawJsonPaste}
                      sx={{
                        '& .MuiInputBase-root': {
                          fontFamily: 'monospace',
                          fontSize: '14px',
                        },
                      }}
                    />
                  </Box>
                )}

                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    padding: 2,
                    backgroundColor: '#f9f9f9',
                    minHeight: '300px',
                  }}
                >
                  <JsonView
                    value={jsonData}
                    editable={true}
                    displayDataTypes={false}
                    displayObjectSize={true}
                    enableClipboard={true}
                    collapsed={1}
                    style={{
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      backgroundColor: 'transparent',
                    }}
                    onChange={handleJsonEdit}
                  />

                  {Object.keys(jsonData).length === 0 && (
                    <Box
                      sx={{
                        textAlign: 'center',
                        color: '#666',
                        mt: 4,
                        fontStyle: 'italic',
                      }}
                    >
                      Paste your JSON above to view
                    </Box>
                  )}
                </Box>
              </Box>
            </BaseModalBody>
          </Grid>
          <Grid item>
            <BaseModalFooter
              startChildren={
                <Button variant="outlined" onClick={handleClose}>
                  Cancel
                </Button>
              }
              endChildren={
                <>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    sx={{ ml: 1 }}
                  >
                    {createTicketProductMutation.isPending
                      ? 'Creating...'
                      : 'Submit'}
                  </Button>
                </>
              }
            />
          </Grid>
        </Grid>
      </BaseModal>
    </>
  );
}
