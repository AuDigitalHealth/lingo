/* eslint @typescript-eslint/restrict-plus-operands: "off" */
import React, { useEffect, useRef, useState } from 'react';
import { Concept, NewConceptDetails } from '../../types/concept';
import {
  DrawConceptDiagramArgs,
  drawConceptDiagram,
  drawNewConceptDiagram,
} from './conceptDiagramUtils';
import { useSearchConceptById } from '../../hooks/api/products/useSearchConcept';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';
import { ButtonGroup, IconButton, Stack } from '@mui/material';
import Loading from '../Loading';
import { ZoomIn, ZoomOut } from '@mui/icons-material';

const CONTAINER_WIDTH = 900;
const CONTAINER_HEIGHT = 600;
interface ConceptDiagramProps {
  concept: Concept | null;
  newConcept?: NewConceptDetails;
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

export default function ConceptDiagram({
  concept,
  newConcept,
}: ConceptDiagramProps) {
  const element = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const { applicationConfig } = useApplicationConfigStore();
  const { data, isLoading } = useSearchConceptById(
    concept?.id,
    applicationConfig?.apDefaultBranch as string,
  );
  useEffect(() => {
    if (data !== undefined && element.current !== undefined) {
      const tempImageUri = drawConceptDiagram(data, element, '', '', 0, args);
      setImageUri(tempImageUri);
    }
  }, [element, data]);

  useEffect(() => {
    if (newConcept !== undefined && element.current !== null) {
      const tempImageUri = drawNewConceptDiagram(
        newConcept,
        element,
        '',
        '',
        0,
        args,
      );
      setImageUri(tempImageUri);
    }
  }, [newConcept, element]);

  // set initial zoom for the image
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;

    const widthRatio = CONTAINER_WIDTH / img.naturalWidth;
    const heightRatio = CONTAINER_HEIGHT / img.naturalHeight;
    const initialZoom = Math.min(widthRatio, heightRatio);

    console.log('img width + height');
    console.log({ width: img.naturalWidth, height: img.naturalHeight });
    img.style.width = `${img.naturalWidth * initialZoom}px`;
    img.style.height = `${img.naturalHeight * initialZoom}px`;
  };

  const zoomImage = (scaleFactor: number) => {
    const img = imgRef.current;
    if (img) {
      const currentWidth = img.clientWidth;
      const currentHeight = img.clientHeight;
      img.style.width = `${currentWidth * scaleFactor}px`;
      img.style.height = `${currentHeight * scaleFactor}px`;
    }
  };

  return (
    <Stack
      alignItems={'end'}
      sx={{
        width: '900px',
        height: '600px',
        position: 'relative',
      }}
    >
      {isLoading && newConcept === undefined ? (
        <Loading />
      ) : (
        <>
          <ButtonGroup
            sx={{
              position: 'sticky',
              top: 0,
              right: 0,
              margin: '10px',
            }}
          >
            <IconButton
              onClick={() => {
                zoomImage(0.9);
              }}
            >
              <ZoomOut />
            </IconButton>
            <IconButton
              onClick={() => {
                zoomImage(1.1);
              }}
            >
              <ZoomIn />
            </IconButton>
          </ButtonGroup>
          <div
            ref={element}
            id="konva-stage-container"
            style={{ display: 'none' }}
          ></div>
          <Stack
            alignItems={'start'}
            sx={{
              width: '900px',
              height: '600px',
              overflowX: 'scroll',
              overflowY: 'scroll',
            }}
          >
            <img
              ref={imgRef}
              src={imageUri}
              alt="Image"
              onLoad={handleImageLoad}
              style={{ cursor: 'move', transformOrigin: '0 0' }}
            />
          </Stack>
        </>
      )}
    </Stack>
  );
}
