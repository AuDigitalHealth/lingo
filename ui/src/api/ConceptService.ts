import axios from 'axios';
import { ConceptResponse } from '../types/concept.ts';

const ConceptService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid concept response');
  },

  async searchConcept(debouncedSearch: any): Promise<ConceptResponse> {
    const response = await axios.get(
      `/snowstorm/snomed-ct/MAIN/concepts?term=${debouncedSearch}`,
    );
    if (response.status != 200) {
      this.handleErrors();
    }
    return response.data as ConceptResponse;
  },
};

export default ConceptService;
