import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Concept } from '../types/concept.ts';
import useConceptStore from '../stores/ConceptStore.ts';
import { Simulate } from 'react-dom/test-utils';
import error = Simulate.error;

function useConceptById() {
  const [concept, setConcept] = useState<Concept | null>();
  const conceptStore = useConceptStore();
  const { id } = useParams();

  useEffect(() => {
    conceptStore
      .getConceptById(id)
      .then(concept => setConcept(concept))
      .catch(error);
  }, [id, conceptStore]);

  return concept;
}

export default useConceptById;
