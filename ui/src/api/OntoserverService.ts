import axios from 'axios';

import type { ValueSet } from 'fhir/r4';
import { appendIdsToEcl } from '../utils/helpers/EclUtils';

const OntoserverService = {
  handleErrors: () => {
    throw new Error('invalid Ontoserver response');
  },

  async searchConcept(providedEcl: string, filter: string): Promise<ValueSet> {
    const response = await axios.get(
      `https://r4.ontoserver.csiro.au/fhir/ValueSet/$expand?url=http://snomed.info/xsct/32506021000036107/version/20240430?fhir_vs=ecl/${providedEcl}&filter=${filter}&includeDesignations=true`,
    );

    const statusCode = response.status;

    if (statusCode !== 200) {
      this.handleErrors();
    }

    return response.data as ValueSet;
  },
  async searchConceptByIds(
    id: string[],
    branch: string,
    providedEcl?: string,
  ): Promise<ValueSet> {
    if (providedEcl) {
      providedEcl = appendIdsToEcl(providedEcl, id);
    }
    const url = providedEcl
      ? `https://r4.ontoserver.csiro.au/fhir/ValueSet/$expand?url=http://snomed.info/xsct/32506021000036107/version/20240430?fhir_vs=ecl/${providedEcl}&includeDesignations=true`
      : `https://r4.ontoserver.csiro.au/fhir/ValueSet/$expand?url=http://snomed.info/xsct/32506021000036107/version/20240430?fhir_vs=ecl/${providedEcl}&filter=${id[0]}&includeDesignations=true`;
    const response = await axios.get(url);
    if (response.status != 200) {
      this.handleErrors();
    }

    return response.data as ValueSet;
  }
};

export default OntoserverService;
