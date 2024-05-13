/* eslint @typescript-eslint/restrict-plus-operands: "off" */
import { RefObject, useEffect, useRef } from 'react';
import { Concept, SnowstormRelationship } from '../types/concept';
import Konva from 'konva';
import { Layer } from 'konva/lib/Layer';

import tempConcept from './tempConcept';

interface ConceptDiagramProps {
  args: DrawConceptDiagramArgs;
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

export default function ConceptDiagram() {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    drawConceptDiagram(tempConcept, element, '', '', 0, args);
  }, [element]);
  return <div ref={element} id="konva-stage-container"></div>;
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

function drawConceptDiagram(
  concept: Concept,
  div: RefObject<HTMLDivElement>,
  options: string,
  snfConcept: string,
  idSequence: number,
  args: DrawConceptDiagramArgs,
) {
  const tempDiv = document.createElement('div');
  div.current?.appendChild(tempDiv);
  const svgIsaModel = [] as SnowstormRelationship[];
  const svgAttrModel = [] as SnowstormRelationship[];
  const axioms = [] as AxiomArrayThingy[];
  args.numberOfGroups = 0;
  if (args.view === 'stated') {
    concept?.relationships?.forEach(function (field) {
      if (
        field.active === true &&
        field.characteristicType === 'STATED_RELATIONSHIP'
      ) {
        if (field.type.conceptId === '116680003') {
          svgIsaModel.push(field);
        } else {
          if (field.groupId > args.numberOfGroups) {
            args.numberOfGroups = field.groupId;
          }
          svgAttrModel.push(field);
        }
      }
    });
    concept.classAxioms?.forEach(function (axiom) {
      if (axiom.active) {
        const axiomToPush = {
          relationships: [] as SnowstormRelationship[],
          type: 'add',
          definitionStatus: axiom.definitionStatus,
        };
        axiom.relationships.forEach(function (field) {
          if (field.active) {
            axiomToPush.relationships.push(field);
          }
        });
        axioms.push(axiomToPush);
      }
    });
    concept.gciAxioms?.forEach(function (axiom) {
      if (axiom.active) {
        const axiomToPush = {
          relationships: [] as SnowstormRelationship[],
          type: 'gci',
        };
        axiom.relationships.forEach(function (field) {
          if (field.active) {
            axiomToPush.relationships.push(field);
          }
        });
        axioms.push(axiomToPush);
      }
    });
  }

  let height = 350;
  let width = 700;
  svgIsaModel.forEach(() => {
    height = height + 50;
    width = width + 80;
  });
  svgAttrModel.forEach(() => {
    height = height + 65;
    width = width + 110;
  });

  if (args.view === 'stated') {
    concept.classAxioms?.forEach(function (axiom) {
      height += 40;
      width += 80;
      axiom.relationships.forEach(function (field) {
        if (field.active) {
          height += 55;
          width += 110;
        }
      });
    });

    concept.gciAxioms?.forEach(function (axiom) {
      height += 40;
      width += 80;
      axiom.relationships.forEach(function (field) {
        if (field.active) {
          height += 55;
          width += 110;
        }
      });
    });
  }
  args.height = height;
  args.width = width;

  const stage = new Konva.Stage({
    container: 'konva-stage-container',
    height: height,
    width: width,
  });

  const layer = new Konva.Layer();

  let x = 10;
  let y = 10;
  let maxX = 10;
  let sctClass = '';
  if (concept.definitionStatus === 'PRIMITIVE') {
    sctClass = 'sct-primitive-concept';
  } else {
    sctClass = 'sct-defined-concept';
  }

  const rect1 = drawSctBox(
    layer,
    x,
    y,
    concept.fsn?.term as unknown as string,
    concept.conceptId as string,
    sctClass,
    0,
  );

  x = x + 90;
  y = y + rect1.getClientRect().height + 40;
  let circle1: Konva.Circle | null = new Konva.Circle();
  if (concept.definitionStatus === 'PRIMITIVE') {
    circle1 = drawSubsumedByNode(layer, x, y);
  } else {
    circle1 = drawEquivalentNode(layer, x, y);
  }
  connectElements(layer, rect1, circle1, 'bottom-50', 'left');
  x = x + 55;
  const circle2 = drawConjunctionNode(layer, x, y);
  connectElements(layer, circle1, circle2, 'right', 'left', 'LineMarker');
  x = x - 58;
  y = y - 54;

  // Adjust position if no IS_A relationship was defined
  if (!svgIsaModel || svgIsaModel.length === 0) {
    x = x + 20;
    y = y + 3;
  }

  maxX = maxX < x ? x : maxX;

  sctClass = 'sct-defined-concept';

  svgIsaModel.forEach(function (relationship) {
    let sctClass = '';
    if (relationship.target.definitionStatus === 'PRIMITIVE') {
      sctClass = 'sct-primitive-concept';
    } else {
      sctClass = 'sct-defined-concept';
    }

    const rectParent = drawSctBox(
      layer,
      x,
      y,
      relationship.concreteValue
        ? relationship.concreteValue.dataType === 'STRING'
          ? '"' + relationship.concreteValue.value + '"'
          : '#' + relationship.concreteValue.value
        : (relationship.target.fsn?.term as string),
      relationship.target?.conceptId as string,
      sctClass,
      idSequence,
    );

    connectElements(
      layer,
      circle2,
      rectParent,
      'center',
      'left',
      'ClearTriangle',
    );
    y = y + rectParent.getClientRect().height + 25;
    maxX =
      maxX < x + rectParent.getClientRect().width + 50
        ? x + rectParent.getClientRect().width + 50
        : maxX;
  });

  //    sets x and y to the position of the first attribute node,
  //  so that sequential attributes, or attribute groups start from the correct base position

  x = circle2.getAbsolutePosition().x;
  y = circle2.getAbsolutePosition().y;

  axioms.forEach((axiom, index) => {
    // let internalCircle1;
    // if (index === 0) {
    //   internalCircle1 = circle1;
    // } else {
    //   if (axiom.type === 'gci') {
    //     internalCircle1 = drawSubsumesNode(layer, x, y);
    //   } else if (
    //     axiom.type !== 'gci' &&
    //     axiom.definitionStatus === 'FULLY_DEFINED'
    //   ) {
    //     internalCircle1 = drawEquivalentNode(layer, x, y);
    //   } else {
    //     internalCircle1 = drawSubsumedByNode(layer, x, y);
    //   }
    // }

    const internalCircle2 =
      index === 0 ? circle2 : drawConjunctionNode(layer, x, y);

    // move x to the right, this sets up the base distance from the main line where
    // either an arrow, or a node will be rendered

    x = x + 50;
    maxX = maxX < x ? x : maxX;

    const axiomRoles: number[] = [];
    // this draws all the ungrouped attributes, and if it encounters an attribute that is grouped
    // it adds it to the axiomRoles array, to be processed later

    axiom.relationships.forEach(relationship => {
      if (relationship.type?.conceptId === '116680003') {
        if (relationship.concreteValue) {
          sctClass = 'concrete-domain';
        } else if (relationship.target.definitionStatus === 'PRIMITIVE') {
          sctClass = 'sct-primitive-concept';
        } else {
          sctClass = 'sct-defined-concept';
        }

        const rectParent = drawSctBox(
          layer,
          x,
          y,
          relationship.concreteValue
            ? relationship.concreteValue.dataType === 'STRING'
              ? '"' + relationship.concreteValue.value + '"'
              : '#' + relationship.concreteValue.value
            : (relationship.target.fsn?.term as string),
          relationship.target?.conceptId as string,
          sctClass,
          idSequence,
        );

        connectElements(
          layer,
          internalCircle2,
          rectParent,
          'center',
          'left',
          'ClearTriangle',
        );
        y = y + rectParent.getClientRect().height + 25;
        maxX =
          maxX < x + rectParent.getClientRect().width + 50
            ? x + rectParent.getClientRect().width + 50
            : maxX;
      } else {
        if (relationship.concreteValue) {
          sctClass = 'concrete-domain';
        } else if (relationship.target.definitionStatus === 'PRIMITIVE') {
          sctClass = 'sct-primitive-concept';
        } else {
          sctClass = 'sct-defined-concept';
        }
        if (relationship.groupId === 0) {
          const rectAttr = drawSctBox(
            layer,
            x,
            y,
            relationship.type.fsn?.term as string,
            relationship.type?.conceptId as string,
            'sct-attribute',
            idSequence,
          );
          connectElements(layer, internalCircle2, rectAttr, 'center', 'left');
          const rectTarget = drawSctBox(
            layer,
            x + rectAttr.getClientRect().width + 50,
            y,
            relationship.concreteValue
              ? relationship.concreteValue.dataType === 'STRING'
                ? '"' + relationship.concreteValue.value + '"'
                : '#' + relationship.concreteValue.value
              : (relationship.target.fsn?.term as string),
            relationship.target?.conceptId as string,
            sctClass,
            idSequence,
          );
          connectElements(layer, rectAttr, rectTarget, 'right', 'left');

          // move y down, to account for the height of this ungrouped attribute
          y = y + rectTarget.getClientRect().height + 25;

          maxX =
            maxX <
            x +
              rectAttr.getClientRect().width +
              50 +
              rectTarget.getClientRect().width +
              50
              ? x +
                rectAttr.getClientRect().width +
                50 +
                rectTarget.getClientRect().width +
                50
              : maxX;
        } else {
          if (!axiomRoles.includes(relationship.groupId)) {
            axiomRoles.push(relationship.groupId);
          }
        }
      }
    });

    y = y + 15;

    // this draws 'grouped' attributes

    for (let thisI = 0; thisI < axiomRoles.length; thisI++) {
      const groupNode = drawAttributeGroupNode(layer, x, y);
      connectElements(layer, internalCircle2, groupNode, 'center', 'left');
      const conjunctionNode = drawConjunctionNode(layer, x + 55, y);
      connectElements(layer, groupNode, conjunctionNode, 'right', 'left');
      axiom.relationships.forEach(relationship => {
        if (relationship.groupId === axiomRoles[thisI]) {
          if (relationship.concreteValue) {
            sctClass = 'concrete-domain';
          } else if (relationship.target.definitionStatus == 'PRIMITIVE') {
            sctClass = 'sct-primitive-concept';
          } else {
            sctClass = 'sct-defined-concept';
          }
          const rectRole = drawSctBox(
            layer,
            x + 85,
            y - 18,
            relationship.type.fsn?.term as string,
            relationship.type?.conceptId as string,
            'sct-attribute',
            idSequence,
          );
          connectElements(layer, conjunctionNode, rectRole, 'center', 'left');
          const rectRole2 = drawSctBox(
            layer,
            x + 85 + rectRole.getClientRect().width + 30,
            y - 18,
            relationship.concreteValue
              ? relationship.concreteValue.dataType === 'STRING'
                ? '"' + relationship.concreteValue.value + '"'
                : '#' + relationship.concreteValue.value
              : (relationship.target.fsn?.term as string),
            relationship.target?.conceptId as string,
            sctClass,
            idSequence,
          );
          connectElements(layer, rectRole, rectRole2, 'right', 'left');
          // move y down, so the next attribute is drawn in the correct position
          y = y + rectRole2.getClientRect().height + 25;
          maxX =
            maxX <
            x +
              85 +
              rectRole.getClientRect().width +
              30 +
              rectRole2.getClientRect().width +
              50
              ? x +
                85 +
                rectRole.getClientRect().width +
                30 +
                rectRole2.getClientRect().width +
                50
              : maxX;
        }
      });
    }
  });
  stage.add(layer);
  layer.draw();

  //   var svgCode = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + parentDiv.html();
  //   svgCode = svgCode.substr(0, svgCode.indexOf("svg") + 4) +
  //     ' xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://web.resource.org/cc/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" ' +
  //     svgCode.substr(svgCode.indexOf("svg") + 4);
  //   svgCode = svgCode.replace('width="1000px" height="2000px"', 'width="' + maxX + '" height="' + y + '"');

  //   // Store svg code for reuse
  //   scope.backupSvgCode = svgCode;

  //   convertToPng(svgCode, concept.conceptId);
}

function drawSctBox(
  layer: Layer,
  x: number,
  y: number,
  label: string,
  sctid: string,
  cssClass: string,
  idSequence: number,
) {
  // x,y coordinates of the top-left corner
  // testText is used to create a vector of the maximum size of the sctId || the label, to see how big the box has to be

  let testText = 'Test';
  if (label && sctid) {
    if (label.length > sctid.toString().length) {
      testText = label;
    } else {
      testText = sctid.toString();
    }
  } else if (label) {
    testText = label;
  } else if (sctid) {
    testText = sctid.toString();
  }
  const fontFamily = '"Helvetica Neue",Helvetica,Arial,sans-serif';

  const tempText = new Konva.Text({
    text: testText,
    x: x,
    y: y,
    fontFamily: fontFamily,
    fontSize: 12,
    fill: 'black',
  });

  const textHeight = tempText.getClientRect().height;
  let textWidth = tempText.getClientRect().width;
  textWidth = Math.round(textWidth * 1.2);
  //   svg.remove(tempText);
  let permIdText: Konva.Text | null = null;
  let permText: Konva.Text | null = null;
  let rectGroup: Konva.Group | null = null;
  let rect: Konva.Rect | null = null;
  let innerRect: Konva.Rect | null = null;

  const widthPadding = 20;
  let heightpadding = 25;
  const concreteWidthPadding = 50;
  const concreteHeightPadding = 20;

  let width = 0;

  if (!sctid || !label) {
    heightpadding = 15;
  }

  const yLocation =
    y > textHeight + heightpadding ? y - (textHeight + heightpadding) / 2 : y;
  rectGroup = new Konva.Group({
    x: x,
    y: yLocation,
    width: textWidth + widthPadding,
    height: textHeight + heightpadding,
  });
  if (cssClass === 'sct-primitive-concept') {
    // console.log('is sct-primitive-concept');

    rect = new Konva.Rect({
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      fill: '#99ccff',
      stroke: '#333',
      strokeWidth: 2,
    });
  } else if (cssClass === 'concrete-domain') {
    if (textWidth + concreteWidthPadding + 4 > 65) {
      width = textWidth + concreteWidthPadding + 4;
    } else {
      width = 65;
    }
    rect = new Konva.Rect({
      width,
      height: textHeight + concreteHeightPadding + 4,
      fill: '#BAEEC8',
      stroke: '#333',
      strokeWidth: 2,
    });
  } else if (cssClass === 'sct-defined-concept') {
    rect = new Konva.Rect({
      x: -2,
      y: -2,
      width: textWidth + widthPadding + 4,
      height: textHeight + heightpadding + 4,
      fill: 'white',
      stroke: '#333',
      strokeWidth: 1,
    });
    innerRect = new Konva.Rect({
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      fill: '#ccccff',
      stroke: '#333',
      strokeWidth: 1,
    });
  } else if (cssClass === 'sct-attribute') {
    rect = new Konva.Rect({
      x: -2,
      y: -2,
      cornerRadius: 18,
      width: textWidth + widthPadding + 4,
      height: textHeight + heightpadding + 4,
      fill: 'white',
      stroke: '#333',
      strokeWidth: 1,
    });
    innerRect = new Konva.Rect({
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      cornerRadius: 18,
      fill: '#ffffcc',
      stroke: '#333',
      strokeWidth: 1,
    });
  } else if (cssClass === 'sct-slot') {
    rect = new Konva.Rect({
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      fill: '#99ccff',
      stroke: '#333',
      strokeWidth: 2,
    });
  } else {
    rect = new Konva.Rect({
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 1,
    });
  }

  if (cssClass == 'concrete-domain') {
    if (textWidth + concreteWidthPadding + 4 > 65) {
      width = textWidth + concreteWidthPadding + 4;
    } else {
      width = 65;
    }
    permText = new Konva.Text({
      text: label,
      x: width / 2 - textWidth / 2,
      y: 13 + ((textHeight + concreteHeightPadding) / 2 - textHeight / 2),
      fontFamily: fontFamily,
      fontSize: 12,
      fill: 'black',
    });
  } else if (sctid && label) {
    permIdText = new Konva.Text({
      text: sctid.toString(),
      x: 10,
      y: 6,
      fontFamily: fontFamily,
      fontSize: 10,
      fill: 'black',
    });
    permText = new Konva.Text({
      text: label,
      x: 10,
      y: 21,
      fontFamily: fontFamily,
      fontSize: 12,
      fill: 'black',
    });
  } else if (label) {
    permIdText = new Konva.Text({
      text: label,
      x: 10,
      y: 18,
      fontFamily: fontFamily,
      fontSize: 12,
      fill: 'black',
    });
  } else if (sctid) {
    permIdText = new Konva.Text({
      text: sctid.toString(),
      x: 10,
      y: 18,
      fontFamily: fontFamily,
      fontSize: 12,
      fill: 'black',
    });
  }

  idSequence++;

  if (rectGroup !== null) {
    rectGroup.add(rect);
    if (innerRect !== null) {
      rectGroup.add(innerRect);
    }
    if (permText !== null) {
      rectGroup.add(permText);
    }
    if (permIdText !== null) {
      rectGroup.add(permIdText);
    }
    layer.add(rectGroup);
  }

  return rect;
}

function connectElements(
  layer: Layer,
  fig1: Konva.Node,
  fig2: Konva.Node,
  side1: string,
  side2: string,
  endMarker?: string,
) {
  const rect1cx = fig1.getClientRect().x;
  const rect1cy = fig1.getClientRect().y;
  const rect1cw = fig1.getClientRect().width;
  const rect1ch = fig1.getClientRect().height;

  const rect2cx = fig2.getClientRect().x;
  const rect2cy = fig2.getClientRect().y;
  const rect2cw = fig2.getClientRect().width;
  const rect2ch = fig2.getClientRect().height;

  let originX = 0;
  let originY = 0;

  let destinationX = 0;
  let destinationY = 0;

  switch (side1) {
    case 'top':
      originY = rect1cy;
      originX = rect1cx + rect1cw / 2;
      break;
    case 'bottom':
      originY = rect1cy + rect1ch;
      originX = rect1cx + rect1cw / 2;
      break;
    case 'left':
      originX = rect1cx;
      originY = rect1cy + rect1ch / 2;
      break;
    case 'right':
      originX = rect1cx + rect1cw;
      originY = rect1cy + rect1ch / 2;
      break;
    case 'bottom-50':
      originY = rect1cy + rect1ch;
      originX = rect1cx + 40;
      break;
    default:
      originX = rect1cx + rect1cw / 2;
      originY = rect1cy + rect1ch / 2;
      break;
  }

  switch (side2) {
    case 'top':
      destinationY = rect2cy;
      destinationX = rect2cx + rect2cw / 2;
      break;
    case 'bottom':
      destinationY = rect2cy + rect2ch;
      destinationX = rect2cx + rect2cw / 2;
      break;
    case 'left':
      destinationX = rect2cx;
      destinationY = rect2cy + rect2ch / 2;
      break;
    case 'right':
      destinationX = rect2cx + rect2cw;
      destinationY = rect2cy + rect2ch / 2;
      break;
    case 'bottom-50':
      destinationY = rect2cy + rect2ch;
      destinationX = rect2cx + 50;
      break;
    default:
      destinationX = rect2cx + rect2cw / 2;
      destinationY = rect2cy + rect2ch / 2;
      break;
  }

  if (endMarker == null) endMarker = 'BlackTriangle';

  const polyLine = new Konva.Line({
    points: [
      originX,
      originY,
      originX,
      destinationY,
      destinationX,
      destinationY,
    ],
    fill: 'none',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(polyLine);

  let conjunction: Konva.Shape | null = null;
  switch (endMarker) {
    case 'BlackTriangle':
      conjunction = renderBlackTriangle(destinationX, destinationY);
      break;
    case 'LineMarker':
      conjunction = renderLineMarker(destinationX, destinationY);
      break;
    case 'ClearTriangle':
      conjunction = renderClearTriangle(destinationX, destinationY);
  }
  if (conjunction !== null) {
    layer.add(conjunction);
  }
}

function getMiddleLeft(shape: Konva.Node) {
  const x = shape.x(); // Get the x-coordinate of the shape
  const y = shape.y() + shape.height() / 2; // Get the y-coordinate of the middle of the shape
  return { x: x, y: y };
}
function renderBlackTriangle(startX: number, startY: number) {
  const points = [0, 0, 0, 0];
  const arrow = new Konva.Arrow({
    x: startX,
    y: startY,
    points: points,
    stroke: 'black',
    strokeWidth: 2,
    fill: 'black',
    opacity: 1,
    pointerAtBeginning: false,
    scaleX: 1.2,
    scaleY: 1.2,
    pointerWidth: 8,
    pointerHeight: 8,
    pointerLength: 8,
  });

  return arrow;
}

function renderClearTriangle(startX: number, startY: number) {
  const points = [0, 0, 0, 0];
  const arrow = new Konva.Arrow({
    x: startX,
    y: startY,
    points: points,
    stroke: 'black',
    strokeWidth: 2,
    fill: 'white',
    opacity: 1,
    pointerAtBeginning: false,
    scaleX: 1.2,
    scaleY: 1.2,
    pointerWidth: 8,
    pointerHeight: 8,
    pointerLength: 8,
  });

  return arrow;
}

function renderLineMarker(drawX: number, drawY: number) {
  const line = new Konva.Line({
    points: [drawX, drawY, drawX, drawY],
    fill: 'none',
    stroke: 'black',
    strokeWidth: 2,
  });

  return line;
}

function drawAttributeGroupNode(layer: Layer, x: number, y: number) {
  const circle = new Konva.Circle({
    x,
    y,
    radius: 20,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(circle);
  return circle;
}

function drawConjunctionNode(layer: Layer, x: number, y: number) {
  const circle = new Konva.Circle({
    x,
    y,
    radius: 10,
    fill: 'black',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(circle);

  return circle;
}

function drawEquivalentNode(layer: Layer, x: number, y: number) {
  const circle = new Konva.Circle({
    x,
    y,
    radius: 20,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(circle);

  const line1 = new Konva.Line({
    points: [x - 7, y - 5, x + 7, y - 5],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line1);

  const line2 = new Konva.Line({
    points: [x - 7, y, x + 7, y],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line2);
  const line3 = new Konva.Line({
    points: [x - 7, y + 5, x + 7, y + 5],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line3);

  return circle;
}

function drawSubsumedByNode(layer: Layer, x: number, y: number) {
  const circle = new Konva.Circle({
    x,
    y,
    radius: 20,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(circle);

  const line1 = new Konva.Line({
    points: [x - 7, y - 8, x + 7, y - 8],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line1);

  const line2 = new Konva.Line({
    points: [x - 7, y + 3, x + 7, y + 3],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line2);

  const line3 = new Konva.Line({
    points: [x - 6, y - 8, x - 6, y + 3],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line3);

  const line4 = new Konva.Line({
    points: [x - 7, y + 7, x + 7, y + 7],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line4);

  return circle;
}

function drawSubsumesNode(layer: Layer, x: number, y: number) {
  const circle = new Konva.Circle({
    x,
    y,
    radius: 20,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(circle);

  const line1 = new Konva.Line({
    points: [x - 7, y - 8, x + 7, y - 8],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line1);

  const line2 = new Konva.Line({
    points: [x - 7, y + 3, x + 7, y + 3],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line2);

  const line3 = new Konva.Line({
    points: [x + 6, y - 8, x + 6, y + 3],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line3);

  const line4 = new Konva.Line({
    points: [x - 7, y + 7, x + 7, y + 7],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line4);

  return circle;
}

// function convertToPng(svg, id) {
//   element.find('*').not('.keep').remove();
//   var canvas = document.createElement('canvas');
//   canvas.id = "canvas-" + id;
//   canvas.height = scope.height;
//   canvas.width = scope.width;
//   element.append(canvas);

//   var c = document.getElementById('canvas-' + id);
//   var ctx = c.getContext('2d');
//   ctx.drawSvg(svg, 0, 0, scope.width, scope.height);
//   cropImageFromCanvas(ctx, document.getElementById('canvas-' + id));

//   element.find('#svg-' + id).remove();

//   var img = new Image();
//   img.id = 'image-' + id;
//   if (element.find('#image-' + id)) {
//       // console.log('true');
//     element.find('#image-' + id).remove();
//   }
//   img.src = canvas.toDataURL();
//   scope.downloadLink = img.src;
//   scope.img = img;
//   element.find('#canvas-' + id).remove();
//   element.append(img);
//   element.find('#image-' + id).addClass('img-responsive');
//   element.find('#image-' + id).css('max-width', '100%');
//   element.find('#image-' + id).css('max-height', '100%');
//   element.find('#image-' + id).css('padding', '10px');
//   element.find('#image-' + id).css('width', (canvas.width + 20) + 'px');

// }

// function cropImageFromCanvas(ctx, canvas) {

//   var w = canvas.width,
//     h = canvas.height,
//     pix = {x: [], y: []},
//     imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
//     x, y, index;

//   for (y = 0; y < h; y++) {
//     for (x = 0; x < w; x++) {
//       index = (y * w + x) * 4;
//       if (imageData.data[index + 3] > 0) {

//         pix.x.push(x);
//         pix.y.push(y);

//       }
//     }
//   }
//   pix.x.sort(function (a, b) {
//     return a - b
//   });
//   pix.y.sort(function (a, b) {
//     return a - b
//   });
//   var n = pix.x.length - 1;

//   w = pix.x[n] - pix.x[0];
//   h = pix.y[n] - pix.y[0];
//   var cut = ctx.getImageData(pix.x[0], pix.y[0], w, h);

//   canvas.width = w;
//   canvas.height = h;
//   ctx.putImageData(cut, 0, 0);

//   var image = canvas.toDataURL();

// }

// // function saveAsPng() {
// //   //Create PNG Image
// //   //Get the svg
// //   //Create the canvas element
// //   var canvas = document.createElement('canvas');
// //   canvas.id = "canvas";
// //   document.body.appendChild(canvas);

// //   //Load the canvas element with our svg
// //   canvg(document.getElementById('canvas'), scope.backupSvgCode);

// //   //Save the svg to png
// //   Canvas2Image.saveAsPNG(canvas, null, null, "diagram-" + scope.concept.conceptId);

// //   //Clear the canvas
// //   canvas.width = canvas.width;
// //   document.body.removeChild(canvas);
// // }

// // function saveAsSvg() {
// //   var b64 = Base64.encode(scope.backupSvgCode);
// //   var downloadLink = document.createElement("a");
// //   downloadLink.href = 'data:image/svg+xml;base64,\n' + b64;
// //   downloadLink.download = "diagram-"+ scope.concept.conceptId +".svg";
// //   document.body.appendChild(downloadLink);
// //   downloadLink.click();
// //   document.body.removeChild(downloadLink);
// // }
