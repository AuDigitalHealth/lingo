import axios from 'axios';
import { Concept, ConceptResponse } from '../types/concept.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(debouncedSearch: any): Promise<Concept[]> {
    const response = await axios.get(
      `/snowstorm/snomed-ct/MAIN/concepts?term=${debouncedSearch}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    const conceptResponse = response.data as ConceptResponse;
    return conceptResponse.items;
  },
};

export default ConceptService;
