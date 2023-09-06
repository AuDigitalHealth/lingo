import { Concept, ConceptSearchItem } from '../../types/concept.ts';

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
