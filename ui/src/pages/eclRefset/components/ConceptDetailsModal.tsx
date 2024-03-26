import BaseModal from '../../../components/modal/BaseModal.tsx';
import BaseModalBody from '../../../components/modal/BaseModalBody.tsx';
import BaseModalHeader from '../../../components/modal/BaseModalHeader.tsx';

import React from 'react';

import { Concept } from '../../../types/concept.ts';
import { Table, TableHead, TableRow, TableCell, TableBody, Icon, IconButton } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface ConceptDetailsModalProps {
  concept: Concept;
  handleClose: () => void;
}
export default function LabelSettingsModal({
  concept,
  handleClose
}: ConceptDetailsModalProps) {

  const rows = [
    { property: "Concept ID", value: concept.conceptId},
    { property: "Fully Specified Name", value: concept.fsn?.term},
    { property: "Preferred Term", value: concept.pt?.term},
    { property: "Effective Time", value: concept.effectiveTime},
    { property: "Primitive", value: concept.definitionStatus === undefined ? undefined : concept.definitionStatus === "PRIMITIVE"},
    { property: "Active", value: concept.active},
    { property: "Module ID", value: concept.moduleId},
  ]
  
  return (
    <BaseModal open={!!concept} handleClose={handleClose} sx={{ minWidth: '400px' }} >
      <BaseModalHeader
        title="Concept Details"
      />
      <IconButton 
        onClick={handleClose}
        aria-label="close"
        sx={{position: 'absolute', top: 0, right: 0, mr: '0.5em', mt: '0.5em'}}>
        <CloseIcon />
      </IconButton>
      <BaseModalBody>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Property</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              row.value !== undefined ?
              <TableRow key={row.property}>
                <TableCell>{row.property}</TableCell>
                <TableCell>
                  {
                    typeof row.value === "boolean" ? 
                    <Icon fontSize="inherit" sx={{"& .MuiSvgIcon-root": {fontSize: 'inherit'}}} title={row.value.toString()}>{row.value ? <CheckIcon /> : <CloseIcon />}</Icon> 
                    : <span title={row.value ?? ""}>{row.value}</span>
                  }
                </TableCell>
              </TableRow>
              : null
            ))}
          </TableBody>
        </Table>
      </BaseModalBody>
    </BaseModal>
  );
}
