/* eslint @typescript-eslint/restrict-plus-operands: "off" */
import React, { useState } from 'react';
import { Concept, NewConceptDetails } from '../../types/concept';
import {
  DrawConceptDiagramArgs,
} from './conceptDiagramUtils';
import {
  ButtonGroup,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { ConceptDiagramProp } from './ConceptDiagramModal';
import ConceptDiagram from './ConceptDiagram';

interface DiffConceptDiagramProps {
  leftConcept: ConceptDiagramProp;
  rightConcept: ConceptDiagramProp;
  args?: DrawConceptDiagramArgs;
}

const args = {
  downloadLink: '',
  img: null as unknown as HTMLImageElement,
  backupSvgCode: '',
  height: 0,
  width: 0,
  view: 'stated',
  numberOfGroups: 0,
};

export default function DiffConceptDiagram({
  leftConcept,
  rightConcept,
}: DiffConceptDiagramProps) {
  return (
    <>
      <Stack flexDirection="row">
        <ConceptDiagram
          concept={leftConcept.isNewConcept ? undefined : leftConcept.concept}
          newConcept={
            leftConcept.isNewConcept
              ? leftConcept.concept?.newConceptDetails
              : undefined
          }
        />
        <ConceptDiagram
          concept={rightConcept.isNewConcept ? undefined : rightConcept.concept}
          newConcept={
            rightConcept.isNewConcept
              ? rightConcept.concept?.newConceptDetails
              : (rightConcept.concept as unknown as NewConceptDetails)
          }
        />
      </Stack>
    </>
  );
}

type FormType = 'stated' | 'inferred';

interface FormToggleProps {
  initialValue?: FormType;
  onChange?: (value: FormType) => void;
  hasInferredView?: boolean;
}

const FormToggle = ({
  initialValue = 'stated',
  onChange,
  hasInferredView,
}: FormToggleProps) => {
  const [selected, setSelected] = useState<FormType>(initialValue);

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: FormType | null,
  ) => {
    if (newValue !== null) {
      setSelected(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={selected}
      exclusive
      onChange={handleChange}
      aria-label="form type"
    >
      <ToggleButton value="stated">Stated</ToggleButton>
      <ToggleButton value="inferred" disabled={!hasInferredView}>
        Inferred
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

const hasInferredView = (concept: Concept | undefined) => {
  if (concept === null) return false;
  let hasInferredView = false;
  if (concept?.relationships) {
    concept?.relationships.forEach(field => {
      if (
        field.active === true &&
        field.characteristicType === 'INFERRED_RELATIONSHIP'
      ) {
        hasInferredView = true;
      }
    });
  }
  return hasInferredView;
};
