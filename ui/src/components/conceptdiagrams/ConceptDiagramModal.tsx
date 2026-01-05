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
  hasHistoricalAssociationsChanged,
} from '../../types/concept';
import BaseModal from '../modal/BaseModal';
import BaseModalBody from '../modal/BaseModalBody';
import BaseModalFooter from '../modal/BaseModalFooter';
import BaseModalHeader from '../modal/BaseModalHeader';
import ConceptDiagram from './ConceptDiagram';
import AdditionalPropertiesDisplay from '../../pages/products/components/AdditionalPropertiesDisplay.tsx';
import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DiffConceptDiagram from './DiffConceptDiagram.tsx';
import { Grid } from '@mui/material';
import { Box } from '@mui/material';
import useAuthoringStore from '../../stores/AuthoringStore.ts';
import { isConceptOptionSelected } from '../../utils/helpers/conceptUtils.ts';

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
  let left: ConceptDiagramProp = { concept: undefined, isNewConcept: false };
  let right: ConceptDiagramProp = { concept: undefined, isNewConcept: false };
  const { selectedConceptIdentifiers } = useAuthoringStore();

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
  }

  const { leftTransformed, rightTransformed } = diffConceptsForDiagram(
    left,
    right,
  );

  if (!left || !right) return <></>;

  return (
    <BaseModal
      open={open}
      handleClose={handleClose}
      keepMounted={keepMounted}
      sx={
        leftTransformed && rightTransformed
          ? { width: '80%', height: '90%' }
          : { width: '60%', height: '90%' }
      }
    >
      <Grid container direction="column" sx={{ height: '100%' }}>
        <Grid item>
          <BaseModalHeader title={'Concept Diagram Preview'} />
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
            {leftTransformed && rightTransformed ? (
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  minHeight: 0,
                  width: '100%',
                }}
              >
                <DiffConceptDiagram
                  leftConcept={leftTransformed}
                  rightConcept={rightTransformed}
                />
              </Box>
            ) : (
              <Box
                sx={{ flex: 1, overflow: 'auto', minHeight: 0, width: '100%' }}
              >
                <ConceptDiagram
                  concept={product.concept}
                  newConcept={
                    !isConceptOptionSelected(
                      selectedConceptIdentifiers,
                      product,
                    )
                      ? newConcept
                      : null
                  }
                />
              </Box>
            )}

            <Accordion
              sx={{
                margin: 1,
                marginBottom: '2em',
                flexShrink: 0,
              }}
              defaultExpanded={false}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="additional-properties-content"
                id="additional-properties-header"
                sx={{
                  backgroundColor: '#f5f5f5',
                  borderTop: '1px solid #e0e0e0',
                }}
              >
                <Typography>Additional Properties</Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  padding: 2,
                  overflowY: 'auto',
                  maxHeight: 'calc(25vh - 48px)',
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
        </Grid>
        <Grid item>
          <BaseModalFooter
            startChildren={<></>}
            endChildren={
              <Button variant="contained" onClick={() => handleClose()}>
                Close
              </Button>
            }
          />
        </Grid>
      </Grid>
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

  const tempLeftConcept = leftTransformed.isNewConcept
    ? leftTransformed.concept.newConceptDetails
    : left.concept;
  const leftAxiom: NewConceptAxioms | undefined = tempLeftConcept?.axioms[0];
  const rightAxiom: SnowstormAxiom | undefined = right.concept?.axioms[0];
  if (!leftAxiom || !rightAxiom) {
    return { leftTransformed, rightTransformed };
  }

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
      leftAxiomTarget.relationships = leftAxiom.relationships.map(rel => {
        const relKey = createRelationshipKey(rel);
        if (!rightRelMap.has(relKey)) {
          // This relationship is NEW
          return {
            ...rel,
            newOrRemoved: SnowstormRelationshipNewOrRemoved.NEW,
          };
        }
        return rel; // Unchanged relationship
      });
    }
  }

  // Process right axiom relationships (mark REMOVED if not in left)
  if (rightTransformed.concept?.axioms?.[0] && rightAxiom) {
    if (!leftAxiom) {
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
          if (!leftRelMap.has(relKey)) {
            // This relationship is REMOVED
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
