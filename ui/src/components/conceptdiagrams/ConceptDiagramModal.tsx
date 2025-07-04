import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Typography,
} from '@mui/material';
import {
  AxiomRelationshipNewConcept,
  NewConceptAxioms,
  NewConceptDetails,
  Product,
  SnowstormAxiom,
  SnowstormRelationship,
  SnowstormRelationshipNewOrRemoved,
} from '../../types/concept';
import BaseModal from '../modal/BaseModal';
import BaseModalBody from '../modal/BaseModalBody';
import BaseModalFooter from '../modal/BaseModalFooter';
import BaseModalHeader from '../modal/BaseModalHeader';
import ConceptDiagram from './ConceptDiagram';
import AdditionalPropertiesDisplay from '../../pages/products/components/AdditionalPropertiesDisplay.tsx';
import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Concept } from '../../types/concept';
import { useParams } from 'react-router-dom';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore.ts';
import { useSearchConceptById } from '../../hooks/api/products/useSearchConcept.tsx';
import DiffConceptDiagram from './DiffConceptDiagram.tsx';

type ConceptOrDetails = Product | null | undefined;

export interface ConceptDiagramProp {
  concept: ConceptOrDetails;
  isNewConcept: boolean;
}
interface ConceptDiagramModalProps {
  open: boolean;
  handleClose: () => void;
  newConcept?: NewConceptDetails;
  product: Product;
  keepMounted: boolean;
  branch: string;
}

export default function ConceptDiagramModal({
  open,
  handleClose,
  newConcept,
  product,
  keepMounted,
  branch,
}: ConceptDiagramModalProps) {
  const { branchKey } = useParams();
  const { applicationConfig } = useApplicationConfigStore();
  const fullBranch = `/${applicationConfig.apDefaultBranch}${branchKey ? `/${branchKey}` : ''}`;

  let left: ConceptDiagramProp = { concept: undefined, isNewConcept: false };
  let right: ConceptDiagramProp = { concept: undefined, isNewConcept: false };

  // if(product.originalNode?.conceptId === "556181000220106" || product.conceptId === "556181000220106"){
  //   debugger;
  // }

  if (
    product.concept === null &&
    product.originalNode === null &&
    product.newConceptDetails !== null
  ) {
    left = { concept: product, isNewConcept: true };
  }

  if (
    !product.concept &&
    product.originalNode !== null &&
    product.newConceptDetails !== null
  ) {
    // debugger;
    left = { concept: product, isNewConcept: true };
    right = { concept: product.originalNode.node, isNewConcept: false };
  }

  if (
    product.concept &&
    product.originalNode !== null &&
    product.newConceptDetails === null &&
    product.conceptId !== product.originalNode.conceptId
  ) {
    left = { concept: product, isNewConcept: false };
    right = { concept: product.originalNode.node, isNewConcept: false };
    // debugger;
  }

  const { leftTransformed, rightTransformed } = diffConceptsForDiagram(
    left,
    right,
  );

  if (!left || !right) return <></>;

  // debugger;
  return (
    <BaseModal open={open} handleClose={handleClose} keepMounted={keepMounted}>
      <BaseModalHeader title={'Concept Diagram Preview'} />
      <BaseModalBody sx={{ overflow: 'auto' }}>
        {leftTransformed && rightTransformed ? (
          <DiffConceptDiagram
            leftConcept={leftTransformed}
            rightConcept={rightTransformed}
          />
        ) : (
          <ConceptDiagram concept={product.concept} newConcept={newConcept} />
        )}

        <Accordion
          sx={{
            maxHeight: '25%', // Maximum height when expanded
            '&.Mui-expanded': {
              margin: 0, // Override default margin
            },
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
              },
            }}
          >
            <Typography>Additional Properties</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              padding: 2,
              overflowY: 'auto', // Enable scrolling for content
              maxHeight: 'calc(25vh - 48px)', // Maximum height minus header
            }}
          >
            <AdditionalPropertiesDisplay
              product={product}
              branch={branch}
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

function diffConceptsForDiagram(
  left: ConceptDiagramProp,
  right: ConceptDiagramProp,
): {
  leftTransformed: ConceptDiagramProp | undefined;
  rightTransformed: ConceptDiagramProp | undefined;
} {
  // debugger;
  if (!right || !left)
    return { leftTransformed: left, rightTransformed: right };

  // Deep clone to avoid mutating original objects
  const leftTransformed = JSON.parse(
    JSON.stringify(left),
  ) as ConceptDiagramProp;
  const rightTransformed = JSON.parse(
    JSON.stringify(right),
  ) as ConceptDiagramProp;

  // If either concept is null/undefined, return as is
  if (!left.concept || !right.concept) {
    return { leftTransformed: undefined, rightTransformed: undefined };
  }
  // debugger;
  // Get axioms from both concepts
  // const leftAxioms : SnowstormAxiom | undefined = left.concept.axioms || undefined;
  // const rightAxioms : SnowstormAxiom | undefined = right.concept.axioms || undefined;

  // if(!leftTransformed.concept?.newConceptDetails?.axioms){
  //   return { leftTransformed, rightTransformed };
  // }

  // if(!rightTransformed.concept?.concept?.classAxioms){
  //   return { leftTransformed, rightTransformed };
  // }
  // debugger;
  // Create maps for efficient lookup by axiomId
  // Get axioms from both concepts
  const tempLeftConcept = leftTransformed.isNewConcept
    ? leftTransformed.concept.newConceptDetails
    : left.concept;
  const leftAxiom: NewConceptAxioms | undefined = tempLeftConcept?.axioms[0];
  const rightAxiom: SnowstormAxiom | undefined = right.concept?.axioms[0];
  // debugger;
  if (!leftAxiom || !rightAxiom) {
    return { leftTransformed, rightTransformed };
  }

  // debugger;
  // Create maps for efficient lookup by axiomId
  // Helper function to create relationship key for comparison
  const createRelationshipKey = (rel: AxiomRelationshipNewConcept): string => {
    if (rel.target) {
      return `${rel.groupId}-${rel.type.conceptId}-${rel.target.conceptId}-${rel.target.fsn?.term}`;
    } else if (rel.concreteValue) {
      return `${rel.groupId}-${rel.type.conceptId}-concrete-${rel.concreteValue.valueWithPrefix}`;
    }
    return `${rel.groupId}-${rel.type.conceptId}-undefined`;
  };

  // Process left axiom relationships (mark NEW if not in right)
  const leftAxiomTarget = leftAxiom;
  if (leftAxiomTarget && leftAxiom) {
    if (!rightAxiom) {
      // No right axiom, mark all left relationships as NEW
      console.log('new or removed');
      leftAxiomTarget.relationships = leftAxiom.relationships.map(rel => ({
        ...rel,
        newOrRemoved: SnowstormRelationshipNewOrRemoved.NEW,
      }));
    } else {
      // Compare relationships by semantic content
      const rightRelMap = new Map(
        rightAxiom.relationships?.map(rel => [createRelationshipKey(rel), rel]),
      );

      // debugger;
      leftAxiomTarget.relationships = leftAxiom.relationships.map(rel => {
        const relKey = createRelationshipKey(rel);
        if (!rightRelMap.has(relKey)) {
          // This relationship is NEW
          console.log('new or removed');
          return {
            ...rel,
            newOrRemoved: SnowstormRelationshipNewOrRemoved.NEW,
          };
        }
        return rel; // Unchanged relationship
      });
    }
  }

  // debugger;
  // Process right axiom relationships (mark REMOVED if not in left)
  if (rightTransformed.concept?.axioms?.[0] && rightAxiom) {
    // debugger;
    if (!leftAxiom) {
      // debugger;
      console.log('new or removed');
      // No left axiom, mark all right relationships as REMOVED
      rightTransformed.concept.axioms[0].relationships =
        rightAxiom.relationships.map(rel => ({
          ...rel,
          newOrRemoved: SnowstormRelationshipNewOrRemoved.REMOVED,
        }));
    } else {
      // Compare relationships by semantic content
      const leftRelMap = new Map(
        leftAxiomTarget.relationships.map(rel => [
          createRelationshipKey(rel),
          rel,
        ]),
      );

      rightTransformed.concept.axioms[0].relationships =
        rightAxiom.relationships.map(rel => {
          const relKey = createRelationshipKey(rel);
          // debugger;
          if (!leftRelMap.has(relKey)) {
            // This relationship is REMOVED
            console.log('new or removed');
            return {
              ...rel,
              newOrRemoved: SnowstormRelationshipNewOrRemoved.REMOVED,
            };
          }
          return rel; // Unchanged relationship
        });
    }
  }

  // console.log(leftTransformed);
  console.log(rightTransformed);
  return { leftTransformed, rightTransformed };
}
