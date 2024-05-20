/* eslint @typescript-eslint/restrict-plus-operands: "off" */
import { RefObject, useEffect, useRef, useState } from 'react';
import {
  AxiomRelationshipNewConcept,
  NewConceptDetails,
} from '../../types/concept';
import Konva from 'konva';

import {
  connectElements,
  drawAttributeGroupNode,
  drawConjunctionNode,
  drawEquivalentNode,
  drawNewConceptDiagram,
  drawSctBox,
  drawSubsumedByNode,
  drawSubsumesNode,
  trimLayer,
} from './conceptDiagramUtils';
import { Stack } from '@mui/material';

interface ConceptDiagramNewProductProps {
  args?: DrawConceptDiagramArgs;
  concept: NewConceptDetails;
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

export default function ConceptDiagramNewProduct({
  concept,
}: ConceptDiagramNewProductProps) {
  const element = useRef<HTMLDivElement>(null);
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  useEffect(() => {
    const tempImageUri = drawNewConceptDiagram(
      concept,
      element,
      '',
      '',
      0,
      args,
    );
    setImageUri(tempImageUri);
  }, [element]);

  return (
    <Stack alignItems={'center'}>
      <div
        ref={element}
        id="konva-stage-container"
        style={{ display: 'none' }}
      ></div>
      <img src={imageUri} alt="Image" style={{ maxWidth: '100%' }} />
    </Stack>
  );
}

interface AxiomArrayThingy {
  relationships: AxiomRelationshipNewConcept[];
  type: string;
  definitionStatus?: string;
}

export interface DrawConceptDiagramArgs {
  downloadLink: string;
  img?: HTMLImageElement;
  backupSvgCode: string;
  height: number;
  width: number;
  view: string;
  numberOfGroups: number;
}
