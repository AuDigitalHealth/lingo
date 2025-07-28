/* eslint @typescript-eslint/restrict-plus-operands: "off" */
import React, { useEffect, useRef, useState } from 'react';
import { Concept, NewConceptDetails } from '../../types/concept';
import {
  drawConceptDiagram,
  DrawConceptDiagramArgs,
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
  isSideBySide?: boolean;
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
  isSideBySide = false,
}: ConceptDiagramProps) {
  const { branchKey } = useParams();

  const screenSize = useScreenSize();
  const element = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const { applicationConfig } = useApplicationConfigStore();
  const fullBranch = `${applicationConfig.apDefaultBranch}${branchKey ? `/${branchKey}` : ''}`;
  const { data, isLoading } = useSearchConceptById(
    concept?.conceptId,
    fullBranch,
  );

  const [formType, setFormType] = useState<FormType>('stated');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400); // Default fallback
  const [containerWidth, setContainerWidth] = useState(400);
  useEffect(() => {
    if (containerRef.current) {
      const parentHeight =
        containerRef.current.parentElement?.clientHeight || 400;
      setContainerHeight(parentHeight - 100); // Subtract some padding
      const tempContainerWidth = containerRef.current.clientWidth || 400;
      setContainerWidth(tempContainerWidth - 100);
    }
  }, []);

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

    // Calculate available width based on whether side by side
    const availableWidth = containerWidth;

    // Calculate the ratios to fit the image in the container
    const widthRatio = availableWidth / img.naturalWidth;
    const heightRatio = containerHeight / img.naturalHeight;

    // Use the smaller ratio to maintain aspect ratio while fitting in container
    const fitRatio = Math.min(widthRatio, heightRatio);

    // Ensure the image takes up at least 90% of the available width
    const minWidthScale = 0.9;
    const targetWidthRatio =
      (availableWidth * minWidthScale) / img.naturalWidth;

    // Ensure the image takes up at least 50% of the available height
    const minHeightScale = 0.5;
    const targetHeightRatio =
      (containerHeight * minHeightScale) / img.naturalHeight;

    // Check if image is naturally small (less than 50% of container in either dimension)
    const isNaturallySmall =
      img.naturalWidth < availableWidth * 0.5 ||
      img.naturalHeight < containerHeight * 0.5;

    let initialZoom;

    if (isNaturallySmall) {
      // If naturally small, just use fit ratio to avoid over-enlarging
      initialZoom = fitRatio;
    } else {
      // Use the largest of: fitRatio, targetWidthRatio, or targetHeightRatio
      // This ensures we meet both the 90% width and 50% height requirements
      initialZoom = Math.max(fitRatio, targetWidthRatio, targetHeightRatio);
    }

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

  useEffect(() => {
    let lastZoomTime = 0;
    const throttleDelay = 50; // Milliseconds between zoom events

    const handleWheel = (event: WheelEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();

        const now = Date.now();
        if (now - lastZoomTime < throttleDelay) {
          return; // Skip if too soon after last zoom
        }
        lastZoomTime = now;

        // Determine zoom direction with reduced sensitivity
        // Reduced from 0.9/1.1 to 0.95/1.05 for less sensitivity
        const scaleFactor = event.deltaY > 0 ? 0.95 : 1.05;
        zoomImage(scaleFactor);
      }
    };

    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('wheel', handleWheel, {
        passive: false,
      });
    }

    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handleFormChange = (value: FormType) => {
    setFormType(value);
  };

  return (
    <>
      <Stack
        ref={containerRef}
        flexDirection="column"
        sx={{ minWidth: '50%', height: '100%' }}
      >
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
                />
              </Stack>
            </>
          )}
        </Stack>
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
