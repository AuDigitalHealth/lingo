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
import {
  ButtonGroup,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Loading from '../Loading';
import { ZoomIn, ZoomOut } from '@mui/icons-material';
import useScreenSize from '../../hooks/useScreenSize';
import { useParams } from 'react-router-dom';

interface ConceptDiagramProps {
  concept: Concept | null | undefined;
  newConcept?: NewConceptDetails | null;
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
  const { branchKey } = useParams();

  const screenSize = useScreenSize();
  const element = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const { applicationConfig } = useApplicationConfigStore();
  const fullBranch = `/${applicationConfig.apDefaultBranch}${branchKey ? `/${branchKey}` : ''}`;
  const { data, isLoading } = useSearchConceptById(concept?.id, fullBranch);

  const [formType, setFormType] = useState<FormType>('stated');
  const [containerHeight, setContainerHeight] = useState(screenSize.height);
  const [containerWidth, setContainerWidth] = useState(screenSize.width);

  useEffect(() => {
    if (data !== undefined && element.current !== undefined) {
      const tempImageUri = drawConceptDiagram(data, element, '', '', {
        ...args,
        view: formType,
      });
      setImageUri(tempImageUri);
    }
  }, [element, data, formType]);

  useEffect(() => {
    if (newConcept && element.current !== null) {
      const tempImageUri = drawNewConceptDiagram(
        newConcept,
        element,
        '',
        '',
        args,
      );
      setImageUri(tempImageUri);
    }
  }, [newConcept, element]);

  // set initial zoom for the image
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;

    const minHeight = Math.min(containerHeight, img.naturalHeight);

    const minWidth = Math.min(containerWidth, img.naturalWidth);

    setContainerHeight(minHeight);
    setContainerWidth(minWidth);

    const widthRatio = minWidth / img.naturalWidth;
    const initialZoom = widthRatio;

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

  const handleFormChange = (value: FormType) => {
    setFormType(value);
  };

  return (
    <>
      <Stack sx={{ marginLeft: 'auto' }}>
        <FormToggle
          onChange={handleFormChange}
          initialValue={formType}
          hasInferredView={hasInferredView(data)}
        />
        {isLoading && newConcept === undefined ? null : (
          <ButtonGroup sx={{ marginLeft: 'auto' }}>
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
        )}
      </Stack>

      <Stack
        alignItems={'start'}
        sx={{
          maxWidth: '100%',
          maxHeight: '100%',
          overflow: 'scroll',
          position: 'relative',
        }}
      >
        {isLoading && newConcept === undefined ? (
          <Loading />
        ) : (
          <>
            <div
              ref={element}
              id="konva-stage-container"
              style={{ display: 'none' }}
            ></div>
            <Stack
              alignItems={'start'}
              sx={{
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
              }}
            >
              <img
                ref={imgRef}
                src={imageUri}
                alt="Image"
                onLoad={handleImageLoad}
                style={{ cursor: 'move', transformOrigin: '0 0' }}
                onClick={() => {
                  console.log(imgRef.current?.naturalWidth);
                }}
              />
            </Stack>
          </>
        )}
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
