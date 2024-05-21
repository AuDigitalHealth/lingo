/* eslint @typescript-eslint/restrict-plus-operands: "off" */
import Konva from 'konva';
import {
  AxiomRelationshipNewConcept,
  Concept,
  NewConceptDetails,
  SnowstormRelationship,
} from '../../types/concept';
import { Layer } from 'konva/lib/Layer';
import { RefObject } from 'react';

export function drawSctBox(
  layer: Layer,
  x: number,
  y: number,
  label: string,
  sctid: string | number,
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

export function connectElements(
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

export function getMiddleLeft(shape: Konva.Node) {
  const x = shape.x(); // Get the x-coordinate of the shape
  const y = shape.y() + shape.height() / 2; // Get the y-coordinate of the middle of the shape
  return { x: x, y: y };
}
export function renderBlackTriangle(startX: number, startY: number) {
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

export function renderClearTriangle(startX: number, startY: number) {
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

export function renderLineMarker(drawX: number, drawY: number) {
  const line = new Konva.Line({
    points: [drawX, drawY, drawX, drawY],
    fill: 'none',
    stroke: 'black',
    strokeWidth: 2,
  });

  return line;
}

export function drawAttributeGroupNode(layer: Layer, x: number, y: number) {
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

export function drawConjunctionNode(layer: Layer, x: number, y: number) {
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

export function drawEquivalentNode(layer: Layer, x: number, y: number) {
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

export function drawSubsumedByNode(layer: Layer, x: number, y: number) {
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

export function drawSubsumesNode(layer: Layer, x: number, y: number) {
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

export function trimLayer(
  layer: Konva.Layer,
  additionalX: number,
  additionalY: number,
) {
  const { maxX, maxY } = getMaxXY(layer);

  // update the stage size to match the layer
  const stage = layer.getStage();
  if (stage) {
    stage.width(maxX + additionalX);
    stage.height(maxY + additionalY);
  }
}

export function getMaxXY(node: Konva.Container): {
  maxX: number;
  maxY: number;
} {
  let maxX = 0;
  let maxY = 0;

  node.children.forEach((shape: Konva.Node) => {
    const shapeX = shape.x();
    const shapeY = shape.y();
    let shapeWidth = 0;
    let shapeHeight = 0;

    if (
      shape instanceof Konva.Rect ||
      shape instanceof Konva.Image ||
      shape instanceof Konva.Text
    ) {
      shapeWidth = shape.width();
      shapeHeight = shape.height();
    } else if (shape instanceof Konva.Circle) {
      shapeWidth = shape.radius() * 2;
      shapeHeight = shape.radius() * 2;
    } else if (shape instanceof Konva.Ellipse) {
      shapeWidth = shape.radiusX() * 2;
      shapeHeight = shape.radiusY() * 2;
    } else if (shape instanceof Konva.Line) {
      const points = shape.points();
      for (let i = 0; i < points.length; i += 2) {
        const pointX = points[i] + shapeX;
        const pointY = points[i + 1] + shapeY;
        maxX = Math.max(maxX, pointX);
        maxY = Math.max(maxY, pointY);
      }
      return;
    } else if (shape instanceof Konva.Container) {
      // Recursively get max coordinates for groups or layers
      const { maxX: childMaxX, maxY: childMaxY } = getMaxXY(
        shape as Konva.Container,
      );
      shapeWidth = childMaxX;
      shapeHeight = childMaxY;
    }

    maxX = Math.max(maxX, shapeX + shapeWidth);
    maxY = Math.max(maxY, shapeY + shapeHeight);
  });

  return { maxX, maxY };
}

interface AxiomArrayThingy {
  relationships: AxiomRelationshipNewConcept[];
  type: string;
  definitionStatus?: string;
}
export function drawNewConceptDiagram(
  concept: NewConceptDetails,
  div: RefObject<HTMLDivElement>,
  options: string,
  snfConcept: string,
  idSequence: number,
  args: DrawConceptDiagramArgs,
) {
  const tempDiv = document.createElement('div');
  div.current?.appendChild(tempDiv);
  const svgIsaModel = [] as AxiomRelationshipNewConcept[];
  const svgAttrModel = [] as AxiomRelationshipNewConcept[];
  const axioms = [] as AxiomArrayThingy[];
  args.numberOfGroups = 0;
  if (args.view === 'stated') {
    concept.axioms?.forEach(function (axiom) {
      if (axiom.active) {
        const axiomToPush = {
          relationships: [] as AxiomRelationshipNewConcept[],
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
  }

  let height = 100;
  let width = 250;
  svgIsaModel.forEach(() => {
    height = height + 50;
    width = width + 80;
  });
  svgAttrModel.forEach(() => {
    height = height + 65;
    width = width + 110;
  });

  if (args.view === 'stated') {
    concept.axioms?.forEach(function (axiom) {
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
  if (concept.axioms[0].definitionStatus === 'PRIMITIVE') {
    sctClass = 'sct-primitive-concept';
  } else {
    sctClass = 'sct-defined-concept';
  }

  const rect1 = drawSctBox(
    layer,
    x,
    y,
    concept.fullySpecifiedName as unknown as string,
    concept.conceptId,
    sctClass,
    0,
  );

  x = x + 90;
  y = y + rect1.getClientRect().height + 40;

  // Adjust position if no IS_A relationship was defined
  if (!svgIsaModel || svgIsaModel.length === 0) {
    x = x + 20;
    y = y + 3;
  }

  maxX = maxX < x ? x : maxX;

  sctClass = 'sct-defined-concept';

  //  sets a baseline x, so that each axiom group can start the line in the same place, and then
  // fan out from there.

  const lineStartX = x;

  axioms.forEach(axiom => {
    let x = lineStartX;
    let internalCircle1;

    if (axiom.type === 'gci') {
      internalCircle1 = drawSubsumesNode(layer, x, y);
    } else if (
      axiom.type !== 'gci' &&
      axiom.definitionStatus === 'FULLY_DEFINED'
    ) {
      internalCircle1 = drawEquivalentNode(layer, x, y);
    } else {
      internalCircle1 = drawSubsumedByNode(layer, x, y);
    }

    x = x + 50;
    const internalCircle2 = drawConjunctionNode(layer, x, y);

    connectElements(layer, rect1, internalCircle1, 'bottom-50', 'left');
    connectElements(
      layer,
      internalCircle1,
      internalCircle2,
      'right',
      'left',
      'LineMarker',
    );

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
  trimLayer(layer, 50, 50);
  return stage.toDataURL();
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

export function drawConceptDiagram(
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

  let height = 100;
  let width = 250;
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

  // Adjust position if no IS_A relationship was defined
  if (!svgIsaModel || svgIsaModel.length === 0) {
    x = x + 20;
    y = y + 3;
  }

  maxX = maxX < x ? x : maxX;

  sctClass = 'sct-defined-concept';

  //  sets a baseline x, so that each axiom group can start the line in the same place, and then
  // fan out from there.
  const lineStartX = x;

  axioms.forEach(axiom => {
    let x = lineStartX;
    let internalCircle1;

    if (axiom.type === 'gci') {
      internalCircle1 = drawSubsumesNode(layer, x, y);
    } else if (
      axiom.type !== 'gci' &&
      axiom.definitionStatus === 'FULLY_DEFINED'
    ) {
      internalCircle1 = drawEquivalentNode(layer, x, y);
    } else {
      internalCircle1 = drawSubsumedByNode(layer, x, y);
    }

    x = x + 50;
    const internalCircle2 = drawConjunctionNode(layer, x, y);

    connectElements(layer, rect1, internalCircle1, 'bottom-50', 'left');
    connectElements(
      layer,
      internalCircle1,
      internalCircle2,
      'right',
      'left',
      'LineMarker',
    );
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
  trimLayer(layer, 50, 50);
  return stage.toDataURL();
}
