/* eslint @typescript-eslint/restrict-plus-operands: "off" */
import React, { RefObject, useEffect, useRef, useState } from 'react';
import {
  Concept,
  NewConceptDetails,
  SnowstormRelationship,
} from '../../types/concept';
import Konva from 'konva';
import { Layer } from 'konva/lib/Layer';

import tempConcept from '../tempConcept';
import {
  connectElements,
  drawAttributeGroupNode,
  drawConceptDiagram,
  drawConjunctionNode,
  drawEquivalentNode,
  drawNewConceptDiagram,
  drawSctBox,
  drawSubsumedByNode,
  drawSubsumesNode,
  trimLayer,
} from './conceptDiagramUtils';
import {
  useSearchConcept,
  useSearchConceptById,
} from '../../hooks/api/products/useSearchConcept';
import useApplicationConfigStore from '../../stores/ApplicationConfigStore';
import { ButtonGroup, IconButton, Stack } from '@mui/material';
import Loading from '../Loading';
import { ZoomIn, ZoomOut } from '@mui/icons-material';

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
  const { data, isLoading, error } = useSearchConceptById(
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
    const containerWidth = 700;
    const containerHeight = 500;

    const widthRatio = containerWidth / img.naturalWidth;
    const heightRatio = containerHeight / img.naturalHeight;
    const initialZoom = Math.min(widthRatio, heightRatio);

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
        width: '700px',
        height: '420px',
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
              width: '700px',
              height: '420px',
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

interface AxiomArrayThingy {
  relationships: SnowstormRelationship[];
  type: string;
  definitionStatus?: string;
}

interface DrawConceptDiagramArgs {
  downloadLink: string;
  img?: HTMLImageElement;
  backupSvgCode: string;
  height: number;
  width: number;
  view: string;
  numberOfGroups: number;
}

// function drawConceptDiagram(
//   concept: Concept,
//   div: RefObject<HTMLDivElement>,
//   options: string,
//   snfConcept: string,
//   idSequence: number,
//   args: DrawConceptDiagramArgs,
// ) {
//   const tempDiv = document.createElement('div');
//   div.current?.appendChild(tempDiv);
//   const svgIsaModel = [] as SnowstormRelationship[];
//   const svgAttrModel = [] as SnowstormRelationship[];
//   const axioms = [] as AxiomArrayThingy[];
//   args.numberOfGroups = 0;
//   if (args.view === 'stated') {
//     concept?.relationships?.forEach(function (field) {
//       if (
//         field.active === true &&
//         field.characteristicType === 'STATED_RELATIONSHIP'
//       ) {
//         if (field.type.conceptId === '116680003') {
//           svgIsaModel.push(field);
//         } else {
//           if (field.groupId > args.numberOfGroups) {
//             args.numberOfGroups = field.groupId;
//           }
//           svgAttrModel.push(field);
//         }
//       }
//     });
//     concept.classAxioms?.forEach(function (axiom) {
//       if (axiom.active) {
//         const axiomToPush = {
//           relationships: [] as SnowstormRelationship[],
//           type: 'add',
//           definitionStatus: axiom.definitionStatus,
//         };
//         axiom.relationships.forEach(function (field) {
//           if (field.active) {
//             axiomToPush.relationships.push(field);
//           }
//         });
//         axioms.push(axiomToPush);
//       }
//     });
//     concept.gciAxioms?.forEach(function (axiom) {
//       if (axiom.active) {
//         const axiomToPush = {
//           relationships: [] as SnowstormRelationship[],
//           type: 'gci',
//         };
//         axiom.relationships.forEach(function (field) {
//           if (field.active) {
//             axiomToPush.relationships.push(field);
//           }
//         });
//         axioms.push(axiomToPush);
//       }
//     });
//   }

//   let height = 100;
//   let width = 250;
//   svgIsaModel.forEach(() => {
//     height = height + 50;
//     width = width + 80;
//   });
//   svgAttrModel.forEach(() => {
//     height = height + 65;
//     width = width + 110;
//   });

//   if (args.view === 'stated') {
//     concept.classAxioms?.forEach(function (axiom) {
//       height += 40;
//       width += 80;
//       axiom.relationships.forEach(function (field) {
//         if (field.active) {
//           height += 55;
//           width += 110;
//         }
//       });
//     });

//     concept.gciAxioms?.forEach(function (axiom) {
//       height += 40;
//       width += 80;
//       axiom.relationships.forEach(function (field) {
//         if (field.active) {
//           height += 55;
//           width += 110;
//         }
//       });
//     });
//   }
//   args.height = height;
//   args.width = width;

//   const stage = new Konva.Stage({
//     container: 'konva-stage-container',
//     height: height,
//     width: width,
//   });

//   const layer = new Konva.Layer();

//   let x = 10;
//   let y = 10;
//   let maxX = 10;
//   let sctClass = '';
//   if (concept.definitionStatus === 'PRIMITIVE') {
//     sctClass = 'sct-primitive-concept';
//   } else {
//     sctClass = 'sct-defined-concept';
//   }

//   const rect1 = drawSctBox(
//     layer,
//     x,
//     y,
//     concept.fsn?.term as unknown as string,
//     concept.conceptId as string,
//     sctClass,
//     0,
//   );

//   x = x + 90;
//   y = y + rect1.getClientRect().height + 40;

//   // Adjust position if no IS_A relationship was defined
//   if (!svgIsaModel || svgIsaModel.length === 0) {
//     x = x + 20;
//     y = y + 3;
//   }

//   maxX = maxX < x ? x : maxX;

//   sctClass = 'sct-defined-concept';

//   //  sets a baseline x, so that each axiom group can start the line in the same place, and then
//   // fan out from there.
//   let lineStartX = x;

//   axioms.forEach((axiom, index) => {
//     let x = lineStartX;
//     let internalCircle1;

//     if (axiom.type === 'gci') {
//       internalCircle1 = drawSubsumesNode(layer, x, y);
//     } else if (
//       axiom.type !== 'gci' &&
//       axiom.definitionStatus === 'FULLY_DEFINED'
//     ) {
//       internalCircle1 = drawEquivalentNode(layer, x, y);
//     } else {
//       internalCircle1 = drawSubsumedByNode(layer, x, y);
//     }

//     x = x + 50;
//     const internalCircle2 = drawConjunctionNode(layer, x, y);

//     connectElements(layer, rect1, internalCircle1, 'bottom-50', 'left');
//     connectElements(
//       layer,
//       internalCircle1,
//       internalCircle2,
//       'right',
//       'left',
//       'LineMarker',
//     );
//     // move x to the right, this sets up the base distance from the main line where
//     // either an arrow, or a node will be rendered

//     x = x + 50;
//     maxX = maxX < x ? x : maxX;

//     const axiomRoles: number[] = [];
//     // this draws all the ungrouped attributes, and if it encounters an attribute that is grouped
//     // it adds it to the axiomRoles array, to be processed later

//     axiom.relationships.forEach(relationship => {
//       if (relationship.type?.conceptId === '116680003') {
//         if (relationship.concreteValue) {
//           sctClass = 'concrete-domain';
//         } else if (relationship.target.definitionStatus === 'PRIMITIVE') {
//           sctClass = 'sct-primitive-concept';
//         } else {
//           sctClass = 'sct-defined-concept';
//         }

//         const rectParent = drawSctBox(
//           layer,
//           x,
//           y,
//           relationship.concreteValue
//             ? relationship.concreteValue.dataType === 'STRING'
//               ? '"' + relationship.concreteValue.value + '"'
//               : '#' + relationship.concreteValue.value
//             : (relationship.target.fsn?.term as string),
//           relationship.target?.conceptId as string,
//           sctClass,
//           idSequence,
//         );

//         connectElements(
//           layer,
//           internalCircle2,
//           rectParent,
//           'center',
//           'left',
//           'ClearTriangle',
//         );
//         y = y + rectParent.getClientRect().height + 25;
//         maxX =
//           maxX < x + rectParent.getClientRect().width + 50
//             ? x + rectParent.getClientRect().width + 50
//             : maxX;
//       } else {
//         if (relationship.concreteValue) {
//           sctClass = 'concrete-domain';
//         } else if (relationship.target.definitionStatus === 'PRIMITIVE') {
//           sctClass = 'sct-primitive-concept';
//         } else {
//           sctClass = 'sct-defined-concept';
//         }
//         if (relationship.groupId === 0) {
//           const rectAttr = drawSctBox(
//             layer,
//             x,
//             y,
//             relationship.type.fsn?.term as string,
//             relationship.type?.conceptId as string,
//             'sct-attribute',
//             idSequence,
//           );
//           connectElements(layer, internalCircle2, rectAttr, 'center', 'left');
//           const rectTarget = drawSctBox(
//             layer,
//             x + rectAttr.getClientRect().width + 50,
//             y,
//             relationship.concreteValue
//               ? relationship.concreteValue.dataType === 'STRING'
//                 ? '"' + relationship.concreteValue.value + '"'
//                 : '#' + relationship.concreteValue.value
//               : (relationship.target.fsn?.term as string),
//             relationship.target?.conceptId as string,
//             sctClass,
//             idSequence,
//           );
//           connectElements(layer, rectAttr, rectTarget, 'right', 'left');

//           // move y down, to account for the height of this ungrouped attribute
//           y = y + rectTarget.getClientRect().height + 25;

//           maxX =
//             maxX <
//             x +
//               rectAttr.getClientRect().width +
//               50 +
//               rectTarget.getClientRect().width +
//               50
//               ? x +
//                 rectAttr.getClientRect().width +
//                 50 +
//                 rectTarget.getClientRect().width +
//                 50
//               : maxX;
//         } else {
//           if (!axiomRoles.includes(relationship.groupId)) {
//             axiomRoles.push(relationship.groupId);
//           }
//         }
//       }
//     });

//     y = y + 15;

//     // this draws 'grouped' attributes

//     for (let thisI = 0; thisI < axiomRoles.length; thisI++) {
//       const groupNode = drawAttributeGroupNode(layer, x, y);
//       connectElements(layer, internalCircle2, groupNode, 'center', 'left');
//       const conjunctionNode = drawConjunctionNode(layer, x + 55, y);
//       connectElements(layer, groupNode, conjunctionNode, 'right', 'left');
//       axiom.relationships.forEach(relationship => {
//         if (relationship.groupId === axiomRoles[thisI]) {
//           if (relationship.concreteValue) {
//             sctClass = 'concrete-domain';
//           } else if (relationship.target.definitionStatus == 'PRIMITIVE') {
//             sctClass = 'sct-primitive-concept';
//           } else {
//             sctClass = 'sct-defined-concept';
//           }
//           const rectRole = drawSctBox(
//             layer,
//             x + 85,
//             y - 18,
//             relationship.type.fsn?.term as string,
//             relationship.type?.conceptId as string,
//             'sct-attribute',
//             idSequence,
//           );
//           connectElements(layer, conjunctionNode, rectRole, 'center', 'left');
//           const rectRole2 = drawSctBox(
//             layer,
//             x + 85 + rectRole.getClientRect().width + 30,
//             y - 18,
//             relationship.concreteValue
//               ? relationship.concreteValue.dataType === 'STRING'
//                 ? '"' + relationship.concreteValue.value + '"'
//                 : '#' + relationship.concreteValue.value
//               : (relationship.target.fsn?.term as string),
//             relationship.target?.conceptId as string,
//             sctClass,
//             idSequence,
//           );
//           connectElements(layer, rectRole, rectRole2, 'right', 'left');
//           // move y down, so the next attribute is drawn in the correct position
//           y = y + rectRole2.getClientRect().height + 25;
//           maxX =
//             maxX <
//             x +
//               85 +
//               rectRole.getClientRect().width +
//               30 +
//               rectRole2.getClientRect().width +
//               50
//               ? x +
//                 85 +
//                 rectRole.getClientRect().width +
//                 30 +
//                 rectRole2.getClientRect().width +
//                 50
//               : maxX;
//         }
//       });
//     }
//   });
//   stage.add(layer);
//   trimLayer(layer, 50, 50);
//   return stage.toDataURL();
// }
