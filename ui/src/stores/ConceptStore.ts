import { create } from 'zustand';
import { Concept } from '../types/concept.ts';
import conceptService from '../api/ConceptService.ts';

interface ConceptStoreConfig {
  fetching: boolean;
  getConceptById: (
    conceptId: string | undefined,
  ) => Promise<Concept | undefined | null>;
}

const useConceptStore = create<ConceptStoreConfig>()(set => ({
  fetching: false,

  getConceptById: async (conceptId: string | undefined) => {
    if (conceptId === undefined) {
      return null;
    }
    set(() => ({
      fetching: true,
    }));

    try {
      const concept = await conceptService.getConcept(conceptId);
      return concept;
    } catch (error) {
      console.log(error);
    }
  },
}));

export default useConceptStore;
