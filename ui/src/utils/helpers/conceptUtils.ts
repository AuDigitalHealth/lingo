import {
  Concept,
  ConceptSearchItem,
  Edge,
  Product,
} from '../../types/concept.ts';

function isNumeric(value: string) {
  return /^\d+$/.test(value);
}

export function mapToConcepts(searchItem: ConceptSearchItem[]): Concept[] {
  const conceptList = searchItem.map(function (item) {
    const referencedComponent = item.referencedComponent;
    return referencedComponent;
  });
  return conceptList;
}

export function isArtgId(id: string) {
  if (id == null) {
    return false;
  }
  id = '' + id;
  return (
    isNumeric(id) &&
    Number(id) > 0 &&
    id.length >= 4 &&
    id.length <= 15 &&
    id.match(/\./) == null
  );
}

export function isSctId(id: string) {
  if (id == null) {
    return false;
  }
  id = '' + id;
  return isNumeric(id) && Number(id) > 0 && id.length >= 6 && id.length <= 18;
  // && Enums.Partition.fromCode(Common.getPartition(id)) != null //TODO need to expand this
  // && Verhoeff.isValid(id);
}
export function filterByLabel(productLabels: Product[], label: string) {
  if (!productLabels) {
    return [];
  }
  return productLabels.filter(productLabel => productLabel.label === label);
}
export function isFsnToggleOn(): boolean {
  return localStorage.getItem('fsn_toggle') === 'true' ? true : false;
}

export function ingredientsExpandedStored(): string[] {
  const stored = localStorage.getItem('ingredients-expanded');
  return stored ? stored.split(',') : [];
}
export function storeIngredientsExpanded(val: string[]) {
  localStorage.setItem('ingredients-expanded', val.join());
}

export function findRelations(
  edges: Edge[],
  nodeA: string,
  nodeB: string,
): Edge[] {
  const related = edges.filter(function (el) {
    return (
      (el.source === nodeA && el.target === nodeB) ||
      (el.source === nodeB && el.target === nodeA)
    );
  });
  return related;
}
export function findProductUsingId(conceptId: string, nodes: Product[]) {
  const product = nodes.find(function (p) {
    return p.concept.conceptId === conceptId;
  });
  return product;
}

export function filterByActiveConcepts(concepts: Concept[]) {
  const activeConcepts = concepts.filter(function (concept) {
    return concept.active;
  });
  return activeConcepts;
}
export function addOrRemoveFromArray(array: string[], item: string) {
  const exists = array.includes(item);

  if (exists) {
    return array.filter(c => {
      return c !== item;
    });
  } else {
    const result = array;
    result.push(item);
    return result;
  }
}
export function getDefaultUnit(units: Concept[]) {
  return units.find(unit => unit.pt.term === 'Each');
}
