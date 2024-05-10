import { MutableRefObject, RefObject, useEffect, useRef } from 'react';
import {
  Concept,
  SnowstormAxiom,
  SnowstormRelationship,
} from '../types/concept';
import { isSctId } from '../utils/helpers/conceptUtils';
import Konva from 'konva';
import { Layer } from 'konva/lib/Layer';

const tempConcept = {
  conceptId: '920935011000036104',
  descendantCount: 0,
  fsn: {
    term: 'Berocca Performance (product name)',
    lang: 'en',
  },
  pt: {
    term: 'Berocca Performance',
    lang: 'en',
  },
  active: true,
  effectiveTime: '20240131',
  released: true,
  releasedEffectiveTime: 20240131,
  moduleId: '32506021000036107',
  definitionStatus: 'PRIMITIVE',
  descriptions: [
    {
      active: true,
      moduleId: '32506021000036107',
      released: true,
      releasedEffectiveTime: 20240131,
      descriptionId: '933412011000036115',
      term: 'Berocca Performance',
      conceptId: '920935011000036104',
      typeId: '900000000000013009',
      acceptabilityMap: {
        '32570271000036106': 'PREFERRED',
        '900000000000509007': 'PREFERRED',
        '900000000000508004': 'PREFERRED',
      },
      type: 'SYNONYM',
      lang: 'en',
      caseSignificance: 'ENTIRE_TERM_CASE_SENSITIVE',
      effectiveTime: '20240131',
    },
    {
      active: true,
      moduleId: '32506021000036107',
      released: true,
      releasedEffectiveTime: 20240131,
      descriptionId: '933411011000036114',
      term: 'Berocca Performance (product name)',
      conceptId: '920935011000036104',
      typeId: '900000000000003001',
      acceptabilityMap: {
        '32570271000036106': 'PREFERRED',
        '900000000000509007': 'PREFERRED',
        '900000000000508004': 'PREFERRED',
      },
      type: 'FSN',
      lang: 'en',
      caseSignificance: 'ENTIRE_TERM_CASE_SENSITIVE',
      effectiveTime: '20240131',
    },
  ],
  annotations: [],
  classAxioms: [
    {
      axiomId: '034684bb-b3bb-4f9f-99b5-6db6c4e29364',
      moduleId: '32506021000036107',
      active: true,
      released: true,
      definitionStatusId: '900000000000074008',
      relationships: [
        {
          active: true,
          moduleId: '32506021000036107',
          released: false,
          sourceId: '920935011000036104',
          destinationId: '774167006',
          typeId: '116680003',
          type: {
            conceptId: '116680003',
            active: true,
            definitionStatus: 'PRIMITIVE',
            moduleId: '900000000000012004',
            fsn: {
              term: 'Is a (attribute)',
              lang: 'en',
            },
            pt: {
              term: 'Is a',
              lang: 'en',
            },
            id: '116680003',
          },
          target: {
            conceptId: '774167006',
            active: true,
            definitionStatus: 'PRIMITIVE',
            moduleId: '900000000000207008',
            fsn: {
              term: 'Product name (product name)',
              lang: 'en',
            },
            pt: {
              term: 'Product name',
              lang: 'en',
            },
            id: '774167006',
          },
          groupId: 0,
          modifier: 'EXISTENTIAL',
          characteristicType: 'STATED_RELATIONSHIP',
        },
      ],
      id: '034684bb-b3bb-4f9f-99b5-6db6c4e29364',
      definitionStatus: 'PRIMITIVE',
      effectiveTime: 20240131,
    },
  ],
  gciAxioms: [],
  relationships: [
    {
      active: true,
      moduleId: '32506021000036107',
      released: true,
      releasedEffectiveTime: 20240131,
      relationshipId: '993120091000168128',
      sourceId: '920935011000036104',
      destinationId: '774167006',
      typeId: '116680003',
      type: {
        conceptId: '116680003',
        active: true,
        definitionStatus: 'PRIMITIVE',
        moduleId: '900000000000012004',
        fsn: {
          term: 'Is a (attribute)',
          lang: 'en',
        },
        pt: {
          term: 'Is a',
          lang: 'en',
        },
        id: '116680003',
      },
      target: {
        conceptId: '774167006',
        active: true,
        definitionStatus: 'PRIMITIVE',
        moduleId: '900000000000207008',
        fsn: {
          term: 'Product name (product name)',
          lang: 'en',
        },
        pt: {
          term: 'Product name',
          lang: 'en',
        },
        id: '774167006',
      },
      groupId: 0,
      modifier: 'EXISTENTIAL',
      characteristicType: 'INFERRED_RELATIONSHIP',
      effectiveTime: '20240131',
      id: '993120091000168128',
    },
    {
      active: false,
      moduleId: '32506021000036107',
      released: true,
      releasedEffectiveTime: 20240131,
      relationshipId: '5016601000168125',
      sourceId: '920935011000036104',
      destinationId: '30560011000036108',
      typeId: '116680003',
      type: {
        conceptId: '116680003',
        active: true,
        definitionStatus: 'PRIMITIVE',
        moduleId: '900000000000012004',
        fsn: {
          term: 'Is a (attribute)',
          lang: 'en',
        },
        pt: {
          term: 'Is a',
          lang: 'en',
        },
        id: '116680003',
      },
      target: {
        conceptId: '30560011000036108',
        active: false,
        definitionStatus: 'PRIMITIVE',
        moduleId: '32506021000036107',
        fsn: {
          term: 'trade product (trade product)',
          lang: 'en',
        },
        pt: {
          term: 'trade product',
          lang: 'en',
        },
        id: '30560011000036108',
      },
      groupId: 0,
      modifier: 'EXISTENTIAL',
      characteristicType: 'INFERRED_RELATIONSHIP',
      effectiveTime: '20240131',
      id: '5016601000168125',
    },
  ],
  alternateIdentifiers: [],
  validationResults: [],
} as unknown as Concept;

export default function ConceptDiagram() {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    drawConceptDiagram(tempConcept, element, '', '', 0);
  }, [element]);
  return <div ref={element} id="konva-stage-container"></div>;
}

let scope = {
  downloadLink: '',
  img: null as unknown as HTMLImageElement,
  backupSvgCode: '',
  height: 0,
  width: 0,
  view: 'stated',
  numberOfGroups: 1,
};

interface AxiomArrayThingy {
  relationships: SnowstormRelationship[];
  type: string;
  definitionStatus?: string;
}

function drawConceptDiagram(
  concept: Concept,
  div: RefObject<HTMLDivElement>,
  options: string,
  snfConcept: string,
  idSequence: number,
) {
  const tempDiv = document.createElement('div');
  div.current?.appendChild(tempDiv);
  var svgIsaModel = [] as SnowstormRelationship[];
  var svgAttrModel = [] as SnowstormRelationship[];
  var axioms = [] as AxiomArrayThingy[];
  scope.numberOfGroups = 0;
  if (scope.view === 'stated') {
    concept?.relationships?.forEach(function (field) {
      if (
        field.active === true
      ) {
        if (field.type.conceptId === '116680003') {
          svgIsaModel.push(field);
        } else {
          if (field.groupId > scope.numberOfGroups) {
            scope.numberOfGroups = field.groupId;
          }
          svgAttrModel.push(field);
        }
      }
    });
    concept.classAxioms?.forEach(function (axiom) {
      if (axiom.active) {
        var axiomToPush = {
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
        var axiomToPush = {
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
    // else if (scope.view === 'inferred'){
    //   if (concept.relationships) {
    //     concept.relationships.forEach(field => {       

    //       if (field.active === true && field.characteristicType === "INFERRED_RELATIONSHIP") {
    //         if(!field.target){
    //             field.target = {};
    //         }
    //         if (field.type.conceptId === '116680003') {
    //           svgIsaModel.push(field);
    //         } else {
    //           if(field.groupId > scope.numberOfGroups)
    //               {
    //                   scope.numberOfGroups = field.groupId;
    //               }
    //           svgAttrModel.push(field);
    //         }
    //       }
    //     });
    //   }
    // }
  //   else if (scope.view === 'snf') {
  //      concept.relationships = [];
  //      $.each(snfConcept.concepts, function (i, field) {
  //          field.target = {};
  //          if(field.primitive === true)
  //          {
  //              field.target.definitionStatus = 'PRIMITIVE';
  //          }
  //          else{
  //              field.target.definitionStatus = 'FULLY_DEFINED';
  //          }
  //          field.type = {};
  //          field.type.conceptId = '116680003';
  //          field.target.fsn = field.term;
  //          field.target.conceptId = field.id;
  //          concept.relationships.push(field);
  //       });
  //       if(snfConcept.attributes){
  //           $.each(snfConcept.attributes, function (i, field) {
  //              field.type.conceptId = field.type.id;
  //              field.type.fsn = field.type.term;
  //              field.groupId = 0;
  //              if(field.concrete){
  //                  field.concreteValue = field.value;
  //                  field.target = {};
  //              } else {
  //                 field.target.conceptId = field.target.id;
  //                 field.target.fsn = field.target.term;
  //                 if(field.target.primitive)
  //                 {
  //                     field.target.definitionStatus = 'PRIMITIVE';
  //                 }
  //                 else{
  //                     field.target.definitionStatus = 'FULLY_DEFINED';
  //                 }
  //              }
  //              concept.relationships.push(field);
  //           });
  //       }
  //       if(snfConcept.groups){
  //           $.each(snfConcept.groups, function (i, group) {
  //              $.each(group.attributes, function (j, field) {
  //                  field.type.conceptId = field.type.id;
  //                  field.type.fsn = field.type.term;
  //                  field.groupId = i + 1;
  //                  if(field.concrete){
  //                      field.concreteValue = field.value;
  //                      field.target = {};
  //                  } else {
  //                     field.target.conceptId = field.target.id;
  //                     field.target.fsn = field.target.term;
  //                     if(field.target.primitive)
  //                     {
  //                         field.target.definitionStatus = 'PRIMITIVE';
  //                     }
  //                     else{
  //                         field.target.definitionStatus = 'FULLY_DEFINED';
  //                     }
  //                  }
  //                  concept.relationships.push(field);
  //              });
  //           });
  //       }
  //       $.each(concept.relationships, function (i, field) {
  //         if (field.type.conceptId === '116680003') {
  //           svgIsaModel.push(field);
  //         } else {
  //           svgAttrModel.push(field);
  //         }
  //       });
  //   }
  //   var parentDiv = tempDiv;
  var height = 350;
  var width = 700;
  svgIsaModel.forEach(field => {
    height = height + 50;
    width = width + 80;
  });
  svgAttrModel.forEach(field => {
    height = height + 65;
    width = width + 110;
  });

  if (scope.view === 'stated') {
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
  scope.height = height;
  scope.width = width;

  const stage = new Konva.Stage({
    container: 'konva-stage-container',
    height: height,
    width: width,
  });

  const layer = new Konva.Layer();

  //   loadDefs(svg);
  var x = 10;
  var y = 10;
  var maxX = 10;
  var sctClass = '';
  if (concept.definitionStatus === 'PRIMITIVE') {
    sctClass = 'sct-primitive-concept';
  } else {
    sctClass = 'sct-defined-concept';
  }

  let rect1 = drawSctBox(
    layer,
    x,
    y,
    concept.fsn?.term as unknown as string,
    concept.conceptId as string,
    sctClass,
    0,
  );
  //   layer.add(rect1);

  x = x + 90;
  y = y + rect1.getClientRect().height + 40;
  var circle1: Konva.Circle | null = new Konva.Circle();
  if (concept.definitionStatus === 'PRIMITIVE') {
    circle1 = drawSubsumedByNode(layer, x, y);
  } else {
    circle1 = drawEquivalentNode(layer, x, y);
  }
  connectElements(layer, rect1, circle1, 'bottom-50', 'left');
  x = x + 55;
  let circle2 = drawConjunctionNode(layer, x, y);
  connectElements(layer, circle1, circle2, 'right', 'left', 'LineMarker');
  x = x - 58;
  y = y - 54;

  // Adjust position if no IS_A relationship was defined
  if (!svgIsaModel || svgIsaModel.length === 0) {
    x = x + 20;
    y = y + 3;
  }

  maxX = maxX < x ? x : maxX;
  //   // load stated parents
  sctClass = 'sct-defined-concept';
  
  svgIsaModel.forEach(function (relationship, i) {
    console.log('svgIsaModel');
    console.log(relationship);
    var sctClass;
    if (relationship.target.definitionStatus === 'PRIMITIVE') {
      sctClass = 'sct-primitive-concept';
    } else {
      sctClass = 'sct-defined-concept';
    }
    var rectParent = drawSctBox(
      layer,
      x,
      y,
      relationship.concreteValue
        ? relationship.concreteValue.dataType === 'STRING'
          ? '"' + relationship.concreteValue.value + '"'
          : '#' + relationship.concreteValue.value
        : (relationship.target.fsn?.term as string),
      relationship.target.conceptId as string,
      sctClass,
      idSequence,
    );
    // $("#" + rectParent.id).css({"top":
    // (rectParent.outerHeight()/2) + "px"});
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

  //   // load ungrouped attributes
  //   var maxRoleNumber = 0;
  console.log('svgattrmodel');
  console.log(svgAttrModel);
  //   svgAttrModel.forEach(relationship => {

  //     if (relationship.concreteValue) {
  //         sctClass = "concrete-domain";
  //     } else if (relationship.target.definitionStatus === "PRIMITIVE") {
  //         sctClass = "sct-primitive-concept";
  //     } else {
  //         sctClass = "sct-defined-concept";
  //     }
  //     if (relationship.groupId === 0) {
  //       if(relationship.nest){
  //           var rectAttr = drawSctBox(svg, x, y, relationship.type.fsn, relationship.type.conceptId, "sct-attribute");
  //           connectElements(svg, circle2, rectAttr, 'center', 'left');
  //           x = x + rectAttr.getBBox().width + 25;
  //           y = y + rectAttr.getBBox().height/2;
  //           var circle3 = drawConjunctionNode(svg, x, y);
  //           connectElements(svg, rectAttr, circle3, 'right', 'left', 'LineMarker');
  //           y = y - rectAttr.getBBox().height/2;
  //           x = x - 100;
  //           var rectTarget = drawSctBox(svg, x + rectAttr.getBBox().width + 50, y, relationship.concreteValue ? (relationship.concreteValue.dataType === 'STRING' ? "\"" + relationship.concreteValue.value + "\"" : "#" + relationship.concreteValue.value) : relationship.target.fsn, relationship.target.conceptId, sctClass);
  //           x = x + 100;
  //           connectElements(svg, circle3, rectTarget, 'right', 'left');
  //           y = y + rectTarget.getBBox().height + 25;
  //           maxX = ((maxX < x + rectAttr.getBBox().width + 50 + rectTarget.getBBox().width + 50) ? x + rectAttr.getBBox().width + 50 + rectTarget.getBBox().width + 50 : maxX);
  //       }
  //       else {
  //         var rectAttr = drawSctBox(svg, x, y, relationship.type.fsn, relationship.type.conceptId, "sct-attribute");
  //         connectElements(svg, circle2, rectAttr, 'center', 'left');
  //         var rectTarget = drawSctBox(svg, x + rectAttr.getBBox().width + 50, y, relationship.concreteValue ? (relationship.concreteValue.dataType === 'STRING' ? "\"" + relationship.concreteValue.value + "\"" : "#" + relationship.concreteValue.value) : relationship.target.fsn, relationship.target.conceptId, sctClass);
  //         connectElements(svg, rectAttr, rectTarget, 'right', 'left');
  //         y = y + rectTarget.getBBox().height + 25;
  //         maxX = ((maxX < x + rectAttr.getBBox().width + 50 + rectTarget.getBBox().width + 50) ? x + rectAttr.getBBox().width + 50 + rectTarget.getBBox().width + 50 : maxX);
  //       }
  //     } else {
  //       if (relationship.groupId > maxRoleNumber) {
  //         maxRoleNumber = relationship.groupId;
  //       }
  //     }
  //     if(relationship.nest){
  //           if (relationship.nest[0].target.definitionStatus === "PRIMITIVE") {
  //             sctClass = "sct-primitive-concept";
  //           } else {
  //             sctClass = "sct-defined-concept";
  //           }
  //           y = y + 25;
  //           x = x + 50;
  //           var rectAttrNest = drawSctBox(svg, x, y, relationship.nest[0].type.fsn, relationship.nest[0].type.conceptId, "sct-attribute");
  //           connectElements(svg, circle3, rectAttrNest, 'center', 'left');
  //           var rectTargetNest = drawSctBox(svg, x + rectAttrNest.getBBox().width + 50, y, relationship.nest[0].concreteValue ? (relationship.nest[0].concreteValue.dataType === 'STRING' ? "\"" + relationship.nest[0].concreteValue.value + "\"" : "#" + relationship.nest[0].concreteValue.value) : relationship.nest[0].type.fsn, relationship.nest[0].target.conceptId, sctClass);
  //           connectElements(svg, rectAttrNest, rectTargetNest, 'right', 'left');
  //           y = y + rectTarget.getBBox().height + 25;
  //           maxX = ((maxX < x + rectAttrNest.getBBox().width + 50 + rectTargetNest.getBBox().width + 50) ? x + rectAttrNest.getBBox().width + 50 + rectTargetNest.getBBox().width + 50 : maxX);
  //     }

  // })
  //   y = y + 15;
  //   for (var i = 1; i <= maxRoleNumber; i++) {
  //     var groupNode = drawAttributeGroupNode(svg, x, y);
  //     connectElements(svg, circle2, groupNode, 'center', 'left');
  //     var conjunctionNode = drawConjunctionNode(svg, x + 55, y);
  //     connectElements(svg, groupNode, conjunctionNode, 'right', 'left');
  //     $.each(svgAttrModel, function (m, relationship) {
  //       if (relationship.groupId === i) {
  //         if (relationship.concreteValue) {
  //           sctClass = "concrete-domain";
  //         } else if (relationship.target.definitionStatus == "PRIMITIVE") {
  //           sctClass = "sct-primitive-concept";
  //         } else {
  //           sctClass = "sct-defined-concept";
  //         }
  //         var rectRole = drawSctBox(svg, x + 85, y - 18, relationship.type.fsn, relationship.type.conceptId, "sct-attribute");
  //         connectElements(svg, conjunctionNode, rectRole, 'center', 'left');
  //         var rectRole2 = drawSctBox(svg, x + 85 + rectRole.getBBox().width + 30, y - 18, relationship.concreteValue ? (relationship.concreteValue.dataType === 'STRING' ? "\"" + relationship.concreteValue.value + "\"" : "#" + relationship.concreteValue.value) : relationship.target.fsn, relationship.target.conceptId, sctClass);
  //         connectElements(svg, rectRole, rectRole2, 'right', 'left');
  //         y = y + rectRole2.getBBox().height + 25;
  //         maxX = ((maxX < x + 85 + rectRole.getBBox().width + 30 + rectRole2.getBBox().width + 50) ? x + 85 + rectRole.getBBox().width + 30 + rectRole2.getBBox().width + 50 : maxX);
  //       }
  //     });
  //   }
  console.log('axioms');
  console.log(axioms);
//   drawEquivalentNode(layer, x, y);
//   drawEquivalentNode(layer, maxX, y);
  console.log(x);
  console.log(maxX);
  console.log(y);
  console.log(circle2.getAbsolutePosition());
  console.log(circle1.getAbsolutePosition());
  
  axioms.forEach((axiom, index) => {
    x = 100;
    let internalCircle1;
    if(index === 0){
        internalCircle1 = circle1;
    } else {
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
    }
    
    connectElements(layer, rect1, internalCircle1 as Konva.Circle, 'bottom-50', 'left');
    x = x + 55;
    let internalCircle2 = index === 0 ? circle2 : drawConjunctionNode(layer, x, y);
    connectElements(layer, internalCircle1 as Konva.Circle, internalCircle2, 'right', 'left', 'LineMarker');
    x = x + 40;
    y = y - 18;
    maxX = maxX < x ? x : maxX;
    const axiomRoles : number[] = [];
    axiom.relationships.forEach(relationship => {
      if (relationship.type.conceptId === '116680003') {
        if (relationship.concreteValue) {
          sctClass = 'concrete-domain';
        } else if (relationship.target.definitionStatus === 'PRIMITIVE') {
          sctClass = 'sct-primitive-concept';
        } else {
          sctClass = 'sct-defined-concept';
        }
        var rectParent = drawSctBox(
          layer,
          x,
          y,
          relationship.concreteValue
            ? relationship.concreteValue.dataType === 'STRING'
              ? '"' + relationship.concreteValue.value + '"'
              : '#' + relationship.concreteValue.value
            : relationship.target.fsn?.term as string,
          relationship.target.conceptId as string,
          sctClass,
          idSequence
        );
        // $("#" + rectParent.id).css({"top":
        // (rectParent.outerHeight()/2) + "px"});
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
          var rectAttr = drawSctBox(
            layer,
            x,
            y,
            relationship.type.fsn?.term as string,
            relationship.type.conceptId as string,
            'sct-attribute',
            idSequence
          );
          connectElements(layer, internalCircle2, rectAttr, 'center', 'left');
          var rectTarget = drawSctBox(
            layer,
            x + rectAttr.getClientRect().width + 50,
            y,
            relationship.concreteValue
              ? relationship.concreteValue.dataType === 'STRING'
                ? '"' + relationship.concreteValue.value + '"'
                : '#' + relationship.concreteValue.value
              : relationship.target.fsn?.term as string,
            relationship.target.conceptId as string,
            sctClass,
            idSequence
          );
          connectElements(layer, rectAttr, rectTarget, 'right', 'left');
          y = y + rectTarget.getClientRect().height + 25;
          maxX =
            maxX <
            x + rectAttr.getClientRect().width + 50 + rectTarget.getClientRect().width + 50
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
    for (var i = 0; i < axiomRoles.length; i++) {
      var groupNode = drawAttributeGroupNode(layer, x, y);
      connectElements(layer, internalCircle2, groupNode, 'center', 'left');
      var conjunctionNode = drawConjunctionNode(layer, x + 55, y);
      connectElements(layer, groupNode, conjunctionNode, 'right', 'left');
      axiom.relationships.forEach(relationship => {
        
    
        if (relationship.groupId === axiomRoles[i]) {
          if (relationship.concreteValue) {
            sctClass = 'concrete-domain';
          } else if (relationship.target.definitionStatus == 'PRIMITIVE') {
            sctClass = 'sct-primitive-concept';
          } else {
            sctClass = 'sct-defined-concept';
          }
          var rectRole = drawSctBox(
            layer,
            x + 85,
            y - 18,
            relationship.type.fsn?.term as string,
            relationship.type.conceptId as string,
            'sct-attribute',
            idSequence
          );
          connectElements(layer, conjunctionNode, rectRole, 'center', 'left');
          var rectRole2 = drawSctBox(
            layer,
            x + 85 + rectRole.getClientRect().width + 30,
            y - 18,
            relationship.concreteValue
              ? relationship.concreteValue.dataType === 'STRING'
                ? '"' + relationship.concreteValue.value + '"'
                : '#' + relationship.concreteValue.value
              : relationship.target.fsn?.term as string,
            relationship.target.conceptId as string,
            sctClass,
            idSequence
          );
          connectElements(layer, rectRole, rectRole2, 'right', 'left');
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
    })
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

  var testText = 'Test';
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
  var fontFamily = '"Helvetica Neue",Helvetica,Arial,sans-serif';

  let tempText = new Konva.Text({
    text: testText,
    x: x,
    y: y,
    fontFamily: fontFamily,
    fontSize: 12,
    fill: 'black',
  });

  var textHeight = tempText.getClientRect().height;
  var textWidth = tempText.getClientRect().width;
  textWidth = Math.round(textWidth * 1.2);
  //   svg.remove(tempText);
  let permIdText: Konva.Text | null = null;
  let permText: Konva.Text | null = null;
  let rectGroup: Konva.Group | null = null;
  let rect: Konva.Rect | null = null;

  var widthPadding = 20;
  var heightpadding = 25;
  var concreteWidthPadding = 50;
  var concreteHeightPadding = 20;

  if (!sctid || !label) {
    heightpadding = 15;
  }

  if (cssClass === 'sct-primitive-concept') {
    console.log('is sct-primitive-concept');
    rectGroup = new Konva.Group({
      x,
      y,
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
    });
    rect = new Konva.Rect({
      x: x,
      y: y,
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      fill: '#99ccff',
      stroke: '#333',
      strokeWidth: 2,
    });
    // rect = svg.rect(x, y, textWidth + widthPadding, textHeight + heightpadding, {
    //   id: 'rect' + idSequence,
    //   fill: '#99ccff',
    //   stroke: '#333',
    //   strokeWidth: 2
    // });
  } else if (cssClass === 'concrete-domain') {
    var width = 0;
    if (textWidth + concreteWidthPadding + 4 > 65) {
      width = textWidth + concreteWidthPadding + 4;
    } else {
      width = 65;
    }
    rect = new Konva.Rect({
      x,
      y,
      width,
      height: textHeight + concreteHeightPadding + 4,
      fill: '#BAEEC8',
      stroke: '#333',
      strokeWidth: 2,
    });
    // rect = svg.rect(x, y, width, textHeight + concreteHeightPadding + 4, {fill: '#BAEEC8', stroke: '#333', strokeWidth: 2});
    // var innerRect = svg.polygon([[x, y +10], [x +10, y], [x, y], [x + (width), y],[x + (width -10), y],[x + (width), y + 10], [x + (width), y + (textHeight + concreteHeightPadding -6)],[x + (width -10), y + (textHeight + concreteHeightPadding + 4)], [x +10, y + (textHeight + concreteHeightPadding + 4)], [x, y + (textHeight + concreteHeightPadding -6)]], {id: 'rect'+idSequence, fill: '#BAEEC8', stroke: '#333', strokeWidth: 1});
  } else if (cssClass === 'sct-defined-concept') {
    rect = new Konva.Rect({
      x,
      y,
      width: textWidth + widthPadding + 4,
      height: textHeight + concreteHeightPadding + 4,
      fill: 'white',
      stroke: '#333',
      strokeWidth: 1,
    });
    // rect = svg.rect(x - 2, y - 2, textWidth + widthPadding + 4, textHeight + heightpadding + 4, {
    //   fill: 'white',
    //   stroke: '#333',
    //   strokeWidth: 1
    // });
    // var innerRect = svg.rect(x, y, textWidth + widthPadding, textHeight + heightpadding, {
    //   id: 'rect' + idSequence,
    //   fill: '#ccccff',
    //   stroke: '#333',
    //   strokeWidth: 1
    // });
  } else if (cssClass === 'sct-attribute') {
    rect = new Konva.Rect({
      x: x - 2,
      y: y - 2,
      width: textWidth + widthPadding + 4,
      height: textHeight + heightpadding + 4,
      fill: 'white',
      stroke: '#333',
      strokeWidth: 1,
    });
    // rect = svg.rect(x - 2, y - 2, textWidth + widthPadding + 4, textHeight + heightpadding + 4, 18, 18, {
    //   fill: 'white',
    //   stroke: '#333',
    //   strokeWidth: 1
    // });
    // var innerRect = svg.rect(x, y, textWidth + widthPadding, textHeight + heightpadding, 18, 18, {
    //   id: 'rect' + idSequence,
    //   fill: '#ffffcc',
    //   stroke: '#333',
    //   strokeWidth: 1
    // });
  } else if (cssClass === 'sct-slot') {
    rect = new Konva.Rect({
      x,
      y,
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      fill: '#99ccff',
      stroke: '#333',
      strokeWidth: 2,
    });
    // rect = svg.rect(x, y, textWidth + widthPadding, textHeight + heightpadding, {
    //   id: 'rect' + idSequence,
    //   fill: '#99ccff',
    //   stroke: '#333',
    //   strokeWidth: 2
    // });
  } else if (cssClass === 'sct-slot') {
    rect = new Konva.Rect({
      x,
      y,
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      fill: '#99ccff',
      stroke: '#333',
      strokeWidth: 2,
    });
    // rect = svg.rect(x, y, textWidth + widthPadding, textHeight + heightpadding, {
    //   id: 'rect' + idSequence,
    //   fill: '#99ccff',
    //   stroke: '#333',
    //   strokeWidth: 2
    // });
  } else {
    rect = new Konva.Rect({
      x,
      y,
      width: textWidth + widthPadding,
      height: textHeight + heightpadding,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 1,
    });
    // rect = svg.rect(x, y, textWidth + widthPadding, textHeight + heightpadding, {
    //   id: 'rect' + idSequence,
    //   fill: 'white',
    //   stroke: 'black',
    //   strokeWidth: 1
    // });
  }

  if (cssClass == 'concrete-domain') {
    if (textWidth + concreteWidthPadding + 4 > 65) {
      width = textWidth + concreteWidthPadding + 4;
    } else {
      width = 65;
    }
    permText = new Konva.Text({
      text: label,
      x: x + (width / 2 - textWidth / 2),
      y: y + 13 + ((textHeight + concreteHeightPadding) / 2 - textHeight / 2),
      fontFamily: fontFamily,
      fontSize: 12,
      fill: 'black',
    });
    // svg.text(x + (((width)/2) - (textWidth/2)), y + 13 + (((textHeight + concreteHeightPadding)/2) - (textHeight/2)), label, {fontFamily: fontFamily, fontSize: '12', fill: 'black'});
  } else if (sctid && label) {
    permIdText = new Konva.Text({
      text: sctid.toString(),
      x: x + 10,
      y: y + 6,
      fontFamily: fontFamily,
      fontSize: 10,
      fill: 'black',
    });
    // svg.text(x + 10, y + 16, sctid.toString(), {
    //   fontFamily: fontFamily,
    //   fontSize: '10',
    //   fill: 'black'
    // });
    permText = new Konva.Text({
      text: label,
      x: x + 10,
      y: y + 21,
      fontFamily: fontFamily,
      fontSize: 12,
      fill: 'black',
    });
    // svg.text(x + 10, y + 31, label, {
    //   fontFamily: fontFamily,
    //   fontSize: '12',
    //   fill: 'black'
    // });
  } else if (label) {
    permIdText = new Konva.Text({
      text: label,
      x: x + 10,
      y: y + 18,
      fontFamily: fontFamily,
      fontSize: 12,
      fill: 'black',
    });
  } else if (sctid) {
    permIdText = new Konva.Text({
      text: sctid.toString(),
      x: x + 10,
      y: y + 18,
      fontFamily: fontFamily,
      fontSize: 12,
      fill: 'black',
    });
  }

  idSequence++;

  //   var rects = document.querySelectorAll('rect');
  // rects.forEach(function(rect) {
  //     rect.addEventListener('click', function(evt) {
  //         // Your event handling logic here
  //     });
  // });
  if (rectGroup !== null) {
    rectGroup.add(rect);
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
  var rect1cx = fig1.getClientRect().x;
  var rect1cy = fig1.getClientRect().y;
  var rect1cw = fig1.getClientRect().width;
  var rect1ch = fig1.getClientRect().height;

  var rect2cx = fig2.getClientRect().x;
  var rect2cy = fig2.getClientRect().y;
  var rect2cw = fig2.getClientRect().width;
  var rect2ch = fig2.getClientRect().height;

  switch (side1) {
    case 'top':
      var originY = rect1cy;
      var originX = rect1cx + rect1cw / 2;
      break;
    case 'bottom':
      var originY = rect1cy + rect1ch;
      var originX = rect1cx + rect1cw / 2;
      break;
    case 'left':
      var originX = rect1cx;
      var originY = rect1cy + rect1ch / 2;
      break;
    case 'right':
      var originX = rect1cx + rect1cw;
      var originY = rect1cy + rect1ch / 2;
      break;
    case 'bottom-50':
      var originY = rect1cy + rect1ch;
      var originX = rect1cx + 40;
      break;
    default:
      var originX = rect1cx + rect1cw / 2;
      var originY = rect1cy + rect1ch / 2;
      break;
  }

  switch (side2) {
    case 'top':
      var destinationY = rect2cy;
      var destinationX = rect2cx + rect2cw / 2;
      break;
    case 'bottom':
      var destinationY = rect2cy + rect2ch;
      var destinationX = rect2cx + rect2cw / 2;
      break;
    case 'left':
      var destinationX = rect2cx;
      var destinationY = rect2cy + rect2ch / 2;
      break;
    case 'right':
      var destinationX = rect2cx + rect2cw;
      var destinationY = rect2cy + rect2ch / 2;
      break;
    case 'bottom-50':
      var destinationY = rect2cy + rect2ch;
      var destinationX = rect2cx + 50;
      break;
    default:
      var destinationX = rect2cx + rect2cw / 2;
      var destinationY = rect2cy + rect2ch / 2;
      break;
  }

  if (endMarker == null) endMarker = 'BlackTriangle';

  let polyLine = new Konva.Line({
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

  const middleLeftOfShape = getMiddleLeft(fig2);
  let conjunction: Konva.Shape | null = null;
  switch (endMarker) {
    case 'BlackTriangle':
      conjunction = renderBlackTriangle(
        layer,
        destinationX,
        destinationY,
        middleLeftOfShape.x,
        middleLeftOfShape.y,
      );
      break;
    case 'LineMarker':
      conjunction = renderLineMarker(layer, destinationX, destinationY);
      break;
    case 'ClearTriangle':
      conjunction = renderClearTriangle(layer, destinationX, destinationY);
  }
  if (conjunction !== null) {
    layer.add(conjunction);
  }

  //   var polyline1 = svg.polyline([[originX, originY],
  //       [originX, destinationY], [destinationX, destinationY]]
  //     , {
  //       id: 'poly1',
  //       fill: 'none',
  //       stroke: 'black',
  //       strokeWidth: 2,
  //       'marker-end': 'url(#' + endMarker + ')'
  //     });
}

function getMiddleLeft(shape: Konva.Node) {
  var x = shape.x(); // Get the x-coordinate of the shape
  var y = shape.y() + shape.height() / 2; // Get the y-coordinate of the middle of the shape
  return { x: x, y: y };
}
function renderBlackTriangle(
  layer: Layer,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  let points = [0, 0, 0, 0];
  let arrow = new Konva.Arrow({
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

function renderClearTriangle(layer: Layer, startX: number, startY: number) {
  let points = [0, 0, 0, 0];
  let arrow = new Konva.Arrow({
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

function renderLineMarker(layer: Layer, drawX: number, drawY: number) {
  let line = new Konva.Line({
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
//   var circle = svg.circle(x, y, 20, {
//     fill: 'white',
//     stroke: 'black',
//     strokeWidth: 2
//   });
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
  //   var circle = svg.circle(x, y, 10, {
  //     fill: 'black',
  //     stroke: 'black',
  //     strokeWidth: 2
  //   });

  return circle;
}

function drawEquivalentNode(layer: Layer, x: number, y: number) {
//   var g = svg.group();
const circle = new Konva.Circle({
    x,
    y,
    radius: 20,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(circle);
//   svg.circle(g, x, y, 20, {
//     fill: 'white',
//     stroke: 'black',
//     strokeWidth: 2
//   });
const line1 = new Konva.Line({
    points: [x - 7, y - 5, x + 7, y - 5],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line1);
//   svg.line(g, x - 7, y - 5, x + 7, y - 5, {
//     stroke: 'black',
//     strokeWidth: 2
//   });
const line2 = new Konva.Line({
    points: [x - 7, y, x + 7, y],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line2);
//   svg.line(g, x - 7, y, x + 7, y, {stroke: 'black', strokeWidth: 2});
  const line3 = new Konva.Line({
    points: [x - 7, y + 5, x + 7, y + 5],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line3);
//   svg.line(g, x - 7, y + 5, x + 7, y + 5, {
//     stroke: 'black',
//     strokeWidth: 2
//   });
  return circle;
}

function drawSubsumedByNode(layer: Layer, x: number, y: number) {
  //   var g = layer.group();
  const circle = new Konva.Circle({
    x,
    y,
    radius: 20,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(circle);
  //   svg.circle(g, x, y, 20, {
  //     fill: 'white',
  //     stroke: 'black',
  //     strokeWidth: 2
  //   });
  const line1 = new Konva.Line({
    points: [x - 7, y - 8, x + 7, y - 8],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line1);
  //   svg.line(g, x - 7, y - 8, x + 7, y - 8, {
  //     stroke: 'black',
  //     strokeWidth: 2
  //   });
  const line2 = new Konva.Line({
    points: [x - 7, y + 3, x + 7, y + 3],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line2);
  //   svg.line(g, x - 7, y + 3, x + 7, y + 3, {
  //     stroke: 'black',
  //     strokeWidth: 2
  //   });
  const line3 = new Konva.Line({
    points: [x - 6, y - 8, x - 6, y + 3],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line3);
  //   svg.line(g, x - 6, y - 8, x - 6, y + 3, {
  //     stroke: 'black',
  //     strokeWidth: 2
  //   });
  const line4 = new Konva.Line({
    points: [x - 7, y + 7, x + 7, y + 7],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line4);
  //   svg.line(g, x - 7, y + 7, x + 7, y + 7, {
  //     stroke: 'black',
  //     strokeWidth: 2
  //   });
  return circle;
}

function drawSubsumesNode(layer: Layer, x: number, y: number) {
//   var g = svg.group();
const circle = new Konva.Circle({
    x,
    y,
    radius: 20,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(circle);
//   svg.circle(g, x, y, 20, {
//     fill: 'white',
//     stroke: 'black',
//     strokeWidth: 2
//   });
const line1 = new Konva.Line({
    points: [x - 7, y - 8, x + 7, y - 8],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line1);
//   svg.line(g, x - 7, y - 8, x + 7, y - 8, {
//     stroke: 'black',
//     strokeWidth: 2
//   });
const line2 = new Konva.Line({
    points: [x - 7, y + 3, x + 7, y + 3],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line2);
//   svg.line(g, x - 7, y + 3, x + 7, y + 3, {
//     stroke: 'black',
//     strokeWidth: 2
//   });
const line3 = new Konva.Line({
    points: [x + 6, y - 8, x + 6, y + 3],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line3);
//   svg.line(g, x + 6, y - 8, x + 6, y + 3, {
//     stroke: 'black',
//     strokeWidth: 2
//   });
  const line4 = new Konva.Line({
    points: [x - 7, y + 7, x + 7, y + 7],
    stroke: 'black',
    strokeWidth: 2,
  });
  layer.add(line4);
//   svg.line(g, x - 7, y + 7, x + 7, y + 7, {
//     stroke: 'black',
//     strokeWidth: 2
//   });
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
