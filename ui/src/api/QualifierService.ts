import { Concept } from '../types/concept.ts';

import { BrandCreationDetails } from '../types/product.ts';

import { api } from './api.ts';

const QualifierService = {
  // TODO more useful way to handle errors? retry? something about tasks service being down etc.

  handleErrors: () => {
    throw new Error('invalid product response');
  },
  async createBrand(
    creationDetails: BrandCreationDetails,
    branch: string,
  ): Promise<Concept> {
    const response = await api.post(
      `/api/${branch}/qualifier/product-name`,
      creationDetails,
    );
    if (response.status != 201 && response.status != 422) {
      this.handleErrors();
    }
    const createdBrand = response.data as Concept;
    return createdBrand;
  },
};
export default QualifierService;
