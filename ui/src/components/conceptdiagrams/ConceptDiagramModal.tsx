import { Button } from '@mui/material';
import { Concept, NewConceptDetails } from '../../types/concept';
import BaseModal from '../modal/BaseModal';
import BaseModalBody from '../modal/BaseModalBody';
import BaseModalFooter from '../modal/BaseModalFooter';
import BaseModalHeader from '../modal/BaseModalHeader';
import ConceptDiagram from './ConceptDiagram';

interface ConceptDiagramModalProps {
  open: boolean;
  handleClose: () => void;
  newConcept?: NewConceptDetails;
  concept: Concept | null;
  keepMounted: boolean;
}

export default function ConceptDiagramModal({
  open,
  handleClose,
  newConcept,
  concept,
  keepMounted,
}: ConceptDiagramModalProps) {
  return (
    <BaseModal open={open} handleClose={handleClose} keepMounted={keepMounted}>
      <BaseModalHeader title={'Concept Diagram Preview'} />
      <BaseModalBody>
        <ConceptDiagram concept={concept} newConcept={newConcept} />
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
