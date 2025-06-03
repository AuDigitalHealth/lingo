import { Accordion, AccordionDetails, AccordionSummary, Button, Typography } from '@mui/material';
import { NewConceptDetails, Product } from '../../types/concept';
import BaseModal from '../modal/BaseModal';
import BaseModalBody from '../modal/BaseModalBody';
import BaseModalFooter from '../modal/BaseModalFooter';
import BaseModalHeader from '../modal/BaseModalHeader';
import ConceptDiagram from './ConceptDiagram';
import AdditionalPropertiesDisplay
  from '../../pages/products/components/AdditionalPropertiesDisplay.tsx';
import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ConceptDiagramModalProps {
  open: boolean;
  handleClose: () => void;
  newConcept?: NewConceptDetails;
  product: Product | null;
  keepMounted: boolean;
}

export default function ConceptDiagramModal({
  open,
  handleClose,
  newConcept,
  product,
  keepMounted,
}: ConceptDiagramModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} keepMounted={keepMounted}>
      <BaseModalHeader title={'Concept Diagram Preview'} />
      <BaseModalBody sx={{ overflow: 'auto' }}>
        <ConceptDiagram concept={product.concept} newConcept={newConcept} />

        <Accordion
          sx={{
            maxHeight: '25%', // Maximum height when expanded
            '&.Mui-expanded': {
              margin: 0, // Override default margin
            }
          }}
          defaultExpanded={false} // Start collapsed by default
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="additional-properties-content"
            id="additional-properties-header"
            sx={{
              backgroundColor: '#f5f5f5',
              borderTop: '1px solid #e0e0e0',
              minHeight: '48px',
              '&.Mui-expanded': {
                minHeight: '48px', // Override default expanded height
              }
            }}
          >
            <Typography>Additional Properties</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{
            padding: 2,
            overflowY: 'auto', // Enable scrolling for content
            maxHeight: 'calc(25vh - 48px)' // Maximum height minus header
          }}>
            <AdditionalPropertiesDisplay
              externalIdentifiers={product.externalIdentifiers}
              nonDefiningProperties={product.nonDefiningProperties}
              referenceSets={product.referenceSets}
              showWrapper={false}
            />
          </AccordionDetails>
        </Accordion>

      </BaseModalBody>
      <BaseModalFooter
        startChildren={<></>}
        endChildren={
          <Button variant="contained" onClick={() => handleClose()}>
            Close
          </Button>
        }
      />
    </BaseModal>
  );
}
